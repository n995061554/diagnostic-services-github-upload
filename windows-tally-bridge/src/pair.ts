/**
 * WINDOWS TALLY BRIDGE PAIRING WIZARD
 * DS Distributor Tally Bridge
 *
 * Performs one-time cryptographic pairing between this Windows PC and the Render backend:
 * 1. Takes pairing key from Back Office administrator.
 * 2. Enrolls device with Render and receives unique deviceId and deviceSecret.
 * 3. Tests local Tally ERP 9 HTTP connectivity at 127.0.0.1:9000.
 * 4. Saves configuration to config.json.
 */

import readline from 'readline';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';
import { BridgeSecurity, BridgeConfig } from './security.js';
import { TallyXmlClient } from './tallyXmlClient.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DEFAULT_CONFIG_PATH = path.resolve(__dirname, '..', 'config.json');

function prompt(rl: readline.Interface, question: string, defaultVal = ''): Promise<string> {
  return new Promise(resolve => {
    const promptText = defaultVal ? `${question} [${defaultVal}]: ` : `${question}: `;
    rl.question(promptText, ans => {
      resolve(ans.trim() || defaultVal);
    });
  });
}

export async function runPairingWizard(): Promise<void> {
  console.log('================================================================');
  console.log('  DS DISTRIBUTOR — WINDOWS TALLY ERP 9 BRIDGE PAIRING WIZARD    ');
  console.log('================================================================');
  console.log('This wizard connects your local Tally ERP 9 / TallyPrime installation');
  console.log('to your DS Distributor cloud backend on Render via outbound HTTPS.\n');

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  try {
    const backendUrl = await prompt(
      rl,
      'DS Distributor Render API URL',
      process.env.DS_BACKEND_URL || 'https://diagnostic-services.onrender.com'
    );

    const pairingKey = await prompt(rl, 'Enter 15-Minute Pairing Key from Back Office (e.g. BRG-PAIR-XXXX-XXXX)');
    if (!pairingKey) {
      console.error('\n[ERROR] Pairing key is required. Generate one from Back Office -> Tally Integration -> Pair Device.\n');
      process.exit(1);
    }

    const deviceName = await prompt(
      rl,
      'Friendly Device Name for this PC',
      `Office Workstation (${os.hostname()})`
    );

    const tallyHost = await prompt(rl, 'Local Tally Host (MUST be loopback)', '127.0.0.1');
    const tallyPortStr = await prompt(rl, 'Local Tally Port', '9000');
    const tallyPort = parseInt(tallyPortStr, 10) || 9000;

    const targetCompany = await prompt(
      rl,
      'Target Tally Company Name',
      'A2Z Diagnostic Services India Pvt Ltd'
    );

    console.log('\n[1/3] Enrolling device with DS Distributor Cloud Backend...');
    const pairEndpoint = `${backendUrl.replace(/\/$/, '')}/api/v1/tally-bridge/pair`;

    const pairResponse = await fetch(pairEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pairingKey,
        deviceName,
        clientVersion: '1.0.0-win-service',
        osInfo: `${os.type()} ${os.release()} (${os.arch()})`,
        tallyHost,
        tallyPort
      }),
      signal: AbortSignal.timeout(15000)
    });

    if (!pairResponse.ok) {
      const errBody = await pairResponse.json().catch(() => ({ message: pairResponse.statusText }));
      console.error(`\n[ERROR] Pairing failed (HTTP ${pairResponse.status}): ${errBody.message || 'Unknown error'}`);
      process.exit(1);
    }

    const pairData = await pairResponse.json() as { success: boolean; deviceId: string; deviceSecret: string };
    console.log(`[PASS] Enrolled successfully! Device ID: ${pairData.deviceId}`);

    console.log('\n[2/3] Testing local Tally ERP 9 connection at http://' + tallyHost + ':' + tallyPort + '/...');
    const tallyClient = new TallyXmlClient(tallyHost, tallyPort);
    const tallyStatus = await tallyClient.checkConnection();

    if (tallyStatus.connected) {
      console.log(`[PASS] Tally ERP 9 is responding! (Latency: ${tallyStatus.latencyMs}ms)`);
      if (tallyStatus.activeCompany) {
        console.log(`[INFO] Currently active company in Tally: "${tallyStatus.activeCompany}"`);
        if (tallyStatus.activeCompany.toLowerCase() === targetCompany.toLowerCase()) {
          console.log(`[PASS] Active company matches target company "${targetCompany}"!`);
        } else {
          console.log(`[WARN] Active company does NOT match "${targetCompany}". Remember to open "${targetCompany}" in Tally.`);
        }
      }
    } else {
      console.log(`[WARN] Tally ERP 9 did not respond locally (${tallyStatus.error}).`);
      console.log(`       Ensure Tally is opened with F12 -> Advanced Configuration -> Enable ODBC/HTTP on port ${tallyPort}.`);
    }

    console.log('\n[3/3] Saving encrypted configuration to config.json...');
    const security = new BridgeSecurity();
    const config: BridgeConfig = {
      backendUrl,
      deviceId: pairData.deviceId,
      deviceSecret: pairData.deviceSecret,
      deviceName,
      tallyHost,
      tallyPort,
      targetCompany,
      pollIntervalMs: 3000,
      lastPairedAt: new Date().toISOString()
    };

    security.saveConfig(DEFAULT_CONFIG_PATH, config);
    console.log(`[PASS] Configuration saved to: ${DEFAULT_CONFIG_PATH}`);

    console.log('\n================================================================');
    console.log('  BRIDGE SETUP COMPLETE & READY TO RUN!                         ');
    console.log('================================================================');
    console.log('Options to start the bridge:');
    console.log('  1. Run in console mode:   .\\run-bridge.bat');
    console.log('  2. Install as background: powershell -ExecutionPolicy Bypass -File .\\install-service.ps1');
    console.log('================================================================\n');
  } catch (err: any) {
    console.error('\n[FATAL ERROR] An unexpected error occurred during setup:', err.message);
    process.exit(1);
  } finally {
    rl.close();
  }
}

if (process.argv[1] && (process.argv[1].endsWith('pair.js') || process.argv[1].endsWith('pair.ts'))) {
  runPairingWizard();
}

