/**
 * OFFICE TALLY BRIDGE AGENT ROUTER (Device-Facing Endpoints)
 * Project: DS Distributor Software (D:\diagnostic-services)
 *
 * Exposes device endpoints for the Windows background service on the office PC:
 * - POST /pair: One-time device registration with pairing code
 * - POST /poll: Device long-poll for signed read-only commands
 * - POST /result: Submit command execution results
 * - GET  /health: Lightweight connectivity heartbeat
 *
 * Security:
 * - Device credential authentication (deviceId + deviceSecret / HMAC)
 * - Immediate revocation enforcement
 * - Read-only allowlist validation
 * - Replay and expiration protection
 */

import { Router, Request, Response } from 'express';
import { officeTallyBridgeManager } from './officeTallyBridgeManager.js';
import { TallyBridgeExecutionResult } from './integrationTypes.js';

export function createTallyBridgeRouter(): Router {
  const router = Router();

  const authenticateBridgeDevice = (req: Request, res: Response, next: () => void) => {
    const deviceId = (req.headers['x-bridge-device-id'] as string) || req.body.deviceId;
    const deviceSecret = (req.headers['x-bridge-secret'] as string) || req.body.deviceSecret;

    if (!deviceId || !deviceSecret) {
      return res.status(401).json({
        statusCode: 401,
        error: 'DEVICE_AUTH_REQUIRED',
        message: 'Missing bridge device identification credentials (x-bridge-device-id or x-bridge-secret).'
      });
    }

    const auth = officeTallyBridgeManager.authenticateDevice(deviceId, deviceSecret);
    if (!auth.isAuthenticated) {
      return res.status(403).json({
        statusCode: 403,
        error: 'BRIDGE_DEVICE_UNAUTHORIZED',
        message: auth.error || 'Bridge device authentication failed.'
      });
    }

    (req as any).bridgeDeviceId = deviceId;
    next();
  };

  // ---------------------------------------------------------------------------
  // 1. ONE-TIME PAIRING (Office PC Initial Setup)
  // ---------------------------------------------------------------------------
  router.post('/pair', (req: Request, res: Response) => {
    const {
      pairingKey,
      deviceName,
      clientVersion = '1.0.0-win-service',
      osInfo = 'Windows Office Host',
      tallyHost = '127.0.0.1',
      tallyPort = 9000
    } = req.body;

    if (!pairingKey) {
      return res.status(400).json({
        statusCode: 400,
        error: 'MISSING_PAIRING_KEY',
        message: 'A valid 15-minute pairing key is required to register this bridge device.'
      });
    }

    const result = officeTallyBridgeManager.pairDevice({
      pairingKey,
      deviceName: deviceName || 'Office Tally ERP 9 Workstation',
      clientVersion,
      osInfo,
      tallyHost,
      tallyPort: Number(tallyPort) || 9000
    });

    if (!result.success) {
      return res.status(400).json({
        statusCode: 400,
        error: 'PAIRING_FAILED',
        message: result.error
      });
    }

    res.status(201).json({
      statusCode: 201,
      success: true,
      deviceId: result.deviceId,
      deviceSecret: result.deviceSecret,
      message: 'Windows Bridge device paired successfully. Keep your deviceSecret confidential.'
    });
  });

  // ---------------------------------------------------------------------------
  // 2. POLLING FOR SIGNED COMMANDS (Office PC -> Render Outbound HTTPS)
  // ---------------------------------------------------------------------------
  router.post('/poll', authenticateBridgeDevice, (req: Request, res: Response) => {
    const deviceId = (req as any).bridgeDeviceId;
    const { currentTallyCompany } = req.body;

    const commands = officeTallyBridgeManager.pollCommandsForDevice(deviceId, currentTallyCompany);

    res.json({
      statusCode: 200,
      success: true,
      commandsCount: commands.length,
      commands
    });
  });

  // ---------------------------------------------------------------------------
  // 3. SUBMIT COMMAND EXECUTION RESULT (Office PC -> Render)
  // ---------------------------------------------------------------------------
  router.post('/result', authenticateBridgeDevice, (req: Request, res: Response) => {
    const deviceId = (req as any).bridgeDeviceId;
    const resultPayload = req.body.result as TallyBridgeExecutionResult;

    if (!resultPayload || !resultPayload.commandId) {
      return res.status(400).json({
        statusCode: 400,
        error: 'INVALID_RESULT_PAYLOAD',
        message: 'Result payload with commandId is required.'
      });
    }

    const outcome = officeTallyBridgeManager.recordExecutionResult(deviceId, resultPayload);
    if (!outcome.success) {
      return res.status(400).json({
        statusCode: 400,
        error: 'RESULT_SUBMISSION_FAILED',
        message: outcome.error
      });
    }

    res.json({
      statusCode: 200,
      success: true,
      message: `Result for command ${resultPayload.commandId} successfully recorded.`
    });
  });

  // ---------------------------------------------------------------------------
  // 4. HEARTBEAT / HEALTH
  // ---------------------------------------------------------------------------
  router.get('/health', (_req: Request, res: Response) => {
    res.json({
      statusCode: 200,
      status: 'HEALTHY',
      service: 'DS Distributor Office Tally Bridge Gateway',
      serverTime: new Date().toISOString()
    });
  });

  return router;
}
