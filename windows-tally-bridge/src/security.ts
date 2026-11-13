/**
 * BRIDGE SECURITY MODULE (Windows Office Host)
 * DS Distributor Tally Bridge
 *
 * Implements client-side security policies:
 * - HMAC-SHA256 command signature verification
 * - Nonce replay attack prevention cache
 * - Expired command rejection (60-second command TTL)
 * - Strict read-only command allowlist enforcement
 * - Zero shell command execution
 * - Sensitive log redaction
 */

import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

export interface BridgeConfig {
  backendUrl: string;
  deviceId: string;
  deviceSecret: string;
  deviceName: string;
  tallyHost: string;
  tallyPort: number;
  targetCompany: string;
  pollIntervalMs: number;
  lastPairedAt?: string;
}

export class BridgeSecurity {
  public static readonly ALLOWED_COMMANDS: readonly string[] = [
    'TEST_CONNECTION',
    'LIST_COMPANIES',
    'GET_STOCK_SUMMARY',
    'GET_PRODUCT_PRICES',
    'GET_CUSTOMER_LEDGERS',
    'GET_RECEIPT_VOUCHERS'
  ];

  private seenNonces: Set<string> = new Set();
  private maxNonceCacheSize = 10000;

  /**
   * Validates if a command type is permitted under the strict read-only policy.
   * Rejects any write operations, voucher creation, or unknown commands.
   */
  public isCommandAllowed(commandType: string): boolean {
    return BridgeSecurity.ALLOWED_COMMANDS.includes(commandType);
  }

  /**
   * Verifies command signature using deviceSecret shared with Render.
   */
  public verifyCommandSignature(
    command: {
      commandId: string;
      commandType: string;
      targetCompany: string;
      issuedAt: string;
      expiresAt: string;
      nonce: string;
      commandSignature: string;
    },
    secret: string
  ): boolean {
    if (!command.commandSignature || !secret) {
      return false;
    }

    const payload = `${command.commandId}|${command.commandType}|${command.targetCompany}|${command.issuedAt}|${command.expiresAt}|${command.nonce}`;
    const expectedSig = crypto.createHmac('sha256', secret).update(payload).digest('hex');

    try {
      return crypto.timingSafeEqual(
        Buffer.from(command.commandSignature, 'hex'),
        Buffer.from(expectedSig, 'hex')
      );
    } catch {
      return false;
    }
  }

  /**
   * Replay Protection & Expiration Validation:
   * 1. Rejects commands whose expiration timestamp has passed.
   * 2. Rejects commands whose nonce has already been processed.
   */
  public validateNonceAndExpiry(nonce: string, expiresAt: string): { valid: boolean; error?: string } {
    const now = Date.now();
    const expiryTime = new Date(expiresAt).getTime();

    if (isNaN(expiryTime) || now > expiryTime) {
      return { valid: false, error: `Command expired at ${expiresAt} (Current time: ${new Date(now).toISOString()})` };
    }

    if (this.seenNonces.has(nonce)) {
      return { valid: false, error: `Replay attack detected: Nonce ${nonce} has already been consumed.` };
    }

    // Cache nonce
    this.seenNonces.add(nonce);
    if (this.seenNonces.size > this.maxNonceCacheSize) {
      // Evict oldest nonces when buffer fills
      const iterator = this.seenNonces.values();
      for (let i = 0; i < 1000; i++) {
        const item = iterator.next();
        if (item.done) break;
        this.seenNonces.delete(item.value);
      }
    }

    return { valid: true };
  }

  /**
   * Redacts sensitive secrets from log strings and error messages.
   */
  public redactSensitive(message: string, secrets: string[] = []): string {
    let sanitized = message;
    for (const sec of secrets) {
      if (sec && sec.length > 5) {
        sanitized = sanitized.replaceAll(sec, '***REDACTED***');
      }
    }
    // Also redact authorization headers and secrets patterns
    sanitized = sanitized.replace(/brg-sec-[a-f0-9]+/gi, 'brg-sec-***REDACTED***');
    sanitized = sanitized.replace(/BRG-PAIR-[A-Z0-9-]+/gi, 'BRG-PAIR-***REDACTED***');
    return sanitized;
  }

  /**
   * Safe config file loader.
   */
  public loadConfig(configPath: string): BridgeConfig | null {
    if (!fs.existsSync(configPath)) {
      return null;
    }
    try {
      const raw = fs.readFileSync(configPath, 'utf8');
      return JSON.parse(raw) as BridgeConfig;
    } catch {
      return null;
    }
  }

  /**
   * Safe config file saver.
   */
  public saveConfig(configPath: string, config: BridgeConfig): void {
    const dir = path.dirname(configPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), { encoding: 'utf8', mode: 0o600 });
  }
}

