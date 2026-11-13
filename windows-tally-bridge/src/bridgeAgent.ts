/**
 * WINDOWS TALLY BRIDGE AGENT (Office Background Service)
 * DS Distributor Tally Bridge
 *
 * Runs on the office workstation alongside Tally ERP 9:
 * - Initiates outbound HTTPS polling to Render cloud backend.
 * - Never opens or exposes local port 9000 to the public internet.
 * - Authenticates using paired device credentials.
 * - Verifies HMAC-SHA256 signature for every inbound command.
 * - Enforces replay protection and 60-second command TTL.
 * - Restricts execution to strictly read-only allowlisted operations.
 * - Verifies active Tally company name before returning sensitive data.
 * - Automatically recovers from network disconnects with exponential backoff.
 */

import path from 'path';
import { fileURLToPath } from 'url';
import { TallyXmlClient } from './tallyXmlClient.js';
import { BridgeSecurity, BridgeConfig } from './security.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DEFAULT_CONFIG_PATH = path.resolve(__dirname, '..', 'config.json');

export class BridgeAgent {
  private config: BridgeConfig;
  private tallyClient: TallyXmlClient;
  private security: BridgeSecurity;
  private isRunning = false;
  private consecutiveErrors = 0;

  constructor(config: BridgeConfig) {
    this.config = config;
    this.tallyClient = new TallyXmlClient(config.tallyHost || '127.0.0.1', config.tallyPort || 9000);
    this.security = new BridgeSecurity();
  }

  private log(message: string): void {
    const timestamp = new Date().toISOString();
    const redacted = this.security.redactSensitive(message, [this.config.deviceSecret]);
    console.log(`[${timestamp}] [TallyBridge] ${redacted}`);
  }

  private logError(message: string, error?: any): void {
    const timestamp = new Date().toISOString();
    const errText = error ? ` - ${error.message || error}` : '';
    const redacted = this.security.redactSensitive(`${message}${errText}`, [this.config.deviceSecret]);
    console.error(`[${timestamp}] [TallyBridge:ERROR] ${redacted}`);
  }

  /**
   * Starts the long-polling background loop.
   */
  public async start(): Promise<void> {
    this.isRunning = true;
    this.log(`Starting DS Distributor Tally Bridge Agent v1.0.0`);
    this.log(`Target Backend: ${this.config.backendUrl}`);
    this.log(`Paired Device ID: ${this.config.deviceId}`);
    this.log(`Target Company: "${this.config.targetCompany}"`);
    this.log(`Local Tally Endpoint: http://${this.config.tallyHost}:${this.config.tallyPort}/`);

    // Initial local Tally pre-flight check
    const tallyStatus = await this.tallyClient.checkConnection();
    if (tallyStatus.connected) {
      this.log(`Local Tally ERP 9 is LIVE (Active Company: "${tallyStatus.activeCompany || 'None loaded'}", Latency: ${tallyStatus.latencyMs}ms)`);
    } else {
      this.log(`Warning: Tally ERP 9 is not responding locally (${tallyStatus.error}). The bridge will keep running and reconnect once Tally is opened.`);
    }

    // Polling loop
    while (this.isRunning) {
      try {
        await this.pollAndExecute();
        this.consecutiveErrors = 0;
        await this.sleep(this.config.pollIntervalMs || 3000);
      } catch (err: any) {
        this.consecutiveErrors++;
        const backoffMs = Math.min(30000, 2000 * Math.pow(1.5, Math.min(this.consecutiveErrors, 6)));
        this.logError(`Connection error with DS Distributor cloud backend. Reconnecting in ${Math.round(backoffMs / 1000)}s`, err);
        await this.sleep(backoffMs);
      }
    }
  }

  public stop(): void {
    this.isRunning = false;
    this.log('Office Tally Bridge stopped gracefully.');
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Single polling turn: contacts Render backend, fetches commands, executes allowlisted actions.
   */
  public async pollAndExecute(): Promise<void> {
    // 1. Inspect local Tally to report currently loaded company
    const localTally = await this.tallyClient.checkConnection();
    const currentCompany = localTally.activeCompany || '';

    // 2. Poll Render Cloud Backend
    const pollUrl = `${this.config.backendUrl.replace(/\/$/, '')}/api/v1/tally-bridge/poll`;
    const response = await fetch(pollUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-bridge-device-id': this.config.deviceId,
        'x-bridge-secret': this.config.deviceSecret
      },
      body: JSON.stringify({
        deviceId: this.config.deviceId,
        currentTallyCompany: currentCompany
      }),
      signal: AbortSignal.timeout(10000)
    });

    if (response.status === 403 || response.status === 401) {
      const body = await response.json().catch(() => ({ message: 'Device unauthorized or revoked' }));
      this.logError(`CRITICAL: Bridge device identity rejected by server (${body.message}). The device may have been revoked.`);
      this.stop();
      return;
    }

    if (!response.ok) {
      throw new Error(`Server returned HTTP ${response.status}: ${response.statusText}`);
    }

    const payload = await response.json() as { success: boolean; commands?: any[] };
    const commands = payload.commands || [];

    if (commands.length > 0) {
      this.log(`Received ${commands.length} pending command(s) from DS Distributor.`);
      for (const cmd of commands) {
        await this.processCommand(cmd, localTally);
      }
    }
  }

  /**
   * Validates security constraints and processes a single command.
   */
  public async processCommand(cmd: any, localTally: any): Promise<void> {
    const start = Date.now();
    this.log(`Evaluating command: [${cmd.commandType}] ID: ${cmd.commandId}`);

    // Check 1: Allowlist validation
    if (!this.security.isCommandAllowed(cmd.commandType)) {
      this.logError(`Security Policy Violation: Rejected non-allowlisted command "${cmd.commandType}"`);
      await this.sendResult({
        commandId: cmd.commandId,
        commandType: cmd.commandType,
        success: false,
        executedAt: new Date().toISOString(),
        targetCompany: cmd.targetCompany,
        companyMatched: false,
        error: `Security Violation: Command "${cmd.commandType}" is not on the read-only allowlist.`,
        latencyMs: Date.now() - start
      });
      return;
    }

    // Check 2: Cryptographic HMAC Signature Verification
    const isSigValid = this.security.verifyCommandSignature(cmd, this.config.deviceSecret);
    if (!isSigValid) {
      this.logError(`Security Violation: Command signature invalid for ${cmd.commandId}. Dropping command.`);
      await this.sendResult({
        commandId: cmd.commandId,
        commandType: cmd.commandType,
        success: false,
        executedAt: new Date().toISOString(),
        targetCompany: cmd.targetCompany,
        companyMatched: false,
        error: 'Cryptographic signature mismatch. Command rejected for security.',
        latencyMs: Date.now() - start
      });
      return;
    }

    // Check 3: Replay Protection & Expiration
    const validity = this.security.validateNonceAndExpiry(cmd.nonce, cmd.expiresAt);
    if (!validity.valid) {
      this.logError(`Security Violation: ${validity.error}`);
      await this.sendResult({
        commandId: cmd.commandId,
        commandType: cmd.commandType,
        success: false,
        executedAt: new Date().toISOString(),
        targetCompany: cmd.targetCompany,
        companyMatched: false,
        error: validity.error,
        latencyMs: Date.now() - start
      });
      return;
    }

    // Check 4: Local Tally Reachability
    if (!localTally.connected) {
      this.logError(`Cannot execute ${cmd.commandType}: Local Tally ERP 9 is unreachable.`);
      await this.sendResult({
        commandId: cmd.commandId,
        commandType: cmd.commandType,
        success: false,
        executedAt: new Date().toISOString(),
        targetCompany: cmd.targetCompany,
        companyMatched: false,
        error: `Local Tally ERP 9 is not responding on http://${this.config.tallyHost}:${this.config.tallyPort}/. Verify Tally is open.`,
        latencyMs: Date.now() - start
      });
      return;
    }

    // Check 5: Company Name Match Verification
    const activeCompany = localTally.activeCompany || '';
    const targetCompany = cmd.targetCompany || this.config.targetCompany;
    const isCompanyMatch = activeCompany.toLowerCase() === targetCompany.toLowerCase();

    // TEST_CONNECTION and LIST_COMPANIES can proceed even if specific company isn't selected
    const isSpecialCommand = cmd.commandType === 'TEST_CONNECTION' || cmd.commandType === 'LIST_COMPANIES';

    if (!isCompanyMatch && !isSpecialCommand) {
      this.logError(`Company Mismatch: Active Tally company is "${activeCompany}", but command requested "${targetCompany}". Data access denied.`);
      await this.sendResult({
        commandId: cmd.commandId,
        commandType: cmd.commandType,
        success: false,
        executedAt: new Date().toISOString(),
        targetCompany,
        activeTallyCompany: activeCompany,
        companyMatched: false,
        error: `Active company in Tally ("${activeCompany}") does not match configured target company ("${targetCompany}"). Open the correct company in Tally to synchronize.`,
        latencyMs: Date.now() - start
      });
      return;
    }

    // Execute Allowlisted Operation
    try {
      let data: any = null;
      let rawSummary = '';

      if (cmd.commandType === 'TEST_CONNECTION') {
        data = {
          tallyVersion: localTally.tallyVersion || 'Tally ERP 9',
          loadedCompanies: localTally.loadedCompanies,
          activeCompany
        };
        rawSummary = `Connected to local Tally (${localTally.tallyVersion}). Active Company: "${activeCompany}"`;
      } else if (cmd.commandType === 'LIST_COMPANIES') {
        data = {
          loadedCompanies: localTally.loadedCompanies,
          activeCompany
        };
        rawSummary = `Retrieved ${localTally.loadedCompanies.length} company records from Tally.`;
      } else if (cmd.commandType === 'GET_STOCK_SUMMARY' || cmd.commandType === 'GET_PRODUCT_PRICES') {
        const stockXml = await this.tallyClient.fetchStockSummaryXml(targetCompany);
        data = { rawXml: stockXml };
        rawSummary = `Stock Summary XML extracted (${Buffer.byteLength(stockXml)} bytes).`;
      } else if (cmd.commandType === 'GET_CUSTOMER_LEDGERS') {
        const ledgerXml = await this.tallyClient.fetchCustomerLedgersXml(targetCompany);
        data = { rawXml: ledgerXml };
        rawSummary = `Customer Ledgers XML extracted (${Buffer.byteLength(ledgerXml)} bytes).`;
      } else if (cmd.commandType === 'GET_RECEIPT_VOUCHERS') {
        const voucherXml = await this.tallyClient.fetchReceiptVouchersXml(targetCompany);
        data = { rawXml: voucherXml };
        rawSummary = `Receipt Vouchers XML extracted (${Buffer.byteLength(voucherXml)} bytes).`;
      }

      const latencyMs = Date.now() - start;
      this.log(`Command ${cmd.commandType} executed successfully in ${latencyMs}ms.`);

      await this.sendResult({
        commandId: cmd.commandId,
        commandType: cmd.commandType,
        success: true,
        executedAt: new Date().toISOString(),
        targetCompany,
        activeTallyCompany: activeCompany,
        companyMatched: isCompanyMatch,
        data,
        rawResponseSummary: rawSummary,
        latencyMs
      });
    } catch (execErr: any) {
      this.logError(`Execution failed for ${cmd.commandType}`, execErr);
      await this.sendResult({
        commandId: cmd.commandId,
        commandType: cmd.commandType,
        success: false,
        executedAt: new Date().toISOString(),
        targetCompany,
        activeTallyCompany: activeCompany,
        companyMatched: isCompanyMatch,
        error: execErr.message,
        latencyMs: Date.now() - start
      });
    }
  }

  /**
   * Submits execution result back to Render cloud backend.
   */
  private async sendResult(result: any): Promise<void> {
    const resultUrl = `${this.config.backendUrl.replace(/\/$/, '')}/api/v1/tally-bridge/result`;
    try {
      const res = await fetch(resultUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-bridge-device-id': this.config.deviceId,
          'x-bridge-secret': this.config.deviceSecret
        },
        body: JSON.stringify({
          deviceId: this.config.deviceId,
          result
        }),
        signal: AbortSignal.timeout(10000)
      });

      if (!res.ok) {
        this.logError(`Failed to deliver result for command ${result.commandId}: HTTP ${res.status}`);
      } else {
        this.log(`Result delivered to Render for command ${result.commandId}`);
      }
    } catch (err: any) {
      this.logError(`Network error delivering result for command ${result.commandId}`, err);
    }
  }
}

// Direct invocation CLI runner
if (process.argv[1] && (process.argv[1].endsWith('bridgeAgent.js') || process.argv[1].endsWith('bridgeAgent.ts'))) {
  const security = new BridgeSecurity();
  const config = security.loadConfig(DEFAULT_CONFIG_PATH);

  if (!config) {
    console.error('\n[ERROR] config.json not found! Please run setup-bridge.bat first to pair this office workstation.\n');
    process.exit(1);
  }

  const agent = new BridgeAgent(config);

  process.on('SIGINT', () => {
    agent.stop();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    agent.stop();
    process.exit(0);
  });

  agent.start().catch(err => {
    console.error('Fatal bridge error:', err);
    process.exit(1);
  });
}

