/**
 * ACCOUNTING INTEGRATION REST ROUTER
 * Project: DS Distributor Software (D:\diagnostic-services)
 *
 * Exposes secure REST endpoints for:
 * - Back Office batch approval & price synchronization
 * - Commercial TallyPrime adapter configuration & synthetic test sync
 * - Authoritative customer ledger balance queries (with customer isolation)
 * - Verified payment lifecycle (online gateway & bank transfers)
 * - Integration audit trail
 */

import { Router, Request, Response } from 'express';
import { accountingSyncEngine } from './accountingSyncEngine.js';
import { builtinTallyAdapter } from './tallyAccountingSourceAdapter.js';
import { tallyPrimeCommercialAdapter } from './tallyPrimeCommercialAdapter.js';
import { externalTallyAdapter } from './externalTallyAdapter.js';
import { officeTallyBridgeManager } from './officeTallyBridgeManager.js';

export function createIntegrationRouter(
  productsDb: any[] = [],
  ordersDb: any[] = [],
  invoicesDb: any[] = [],
  customerPriceRulesDb: any[] = [],
  inventoryMovementsDb: any[] = []
): Router {
  const router = Router();

  const getAuthUser = (req: Request) => {
    const u = (req as any).user;
    if (!u) return null;
    return {
      id: u.id,
      email: u.email,
      name: u.name || (u.firstName ? `${u.firstName} ${u.lastName || ''}`.trim() : (u.email || 'Authorized User')),
      role: u.roleType || u.role,
      roleType: u.roleType || u.role,
      labId: u.labId
    };
  };

  const requireBackOffice = (req: Request, res: Response, next: () => void) => {
    const user = getAuthUser(req);
    if (!user) {
      return res.status(401).json({ statusCode: 401, error: 'Unauthorized', message: 'Authentication required.' });
    }
    const allowed = ['SUPER_ADMIN', 'OFFICE_ADMIN', 'ACCOUNTS_STAFF', 'FINANCE_STAFF', 'AUTHORIZED_APPROVER'];
    if (!allowed.includes(user.roleType)) {
      return res.status(403).json({
        statusCode: 403,
        error: 'Forbidden',
        message: `Back Office privilege required. Role "${user.roleType}" does not have sufficient authority.`
      });
    }
    next();
  };

  // ---------------------------------------------------------------------------
  // 1. SYNC BATCHES
  // ---------------------------------------------------------------------------
  // POST /batches - Propose new price sync batch from source
  router.post('/batches', requireBackOffice, (req: Request, res: Response) => {
    const user = getAuthUser(req)!;
    const { source = 'BUILTIN_TALLY', proposedPriceOverrides = [] } = req.body;

    let items;
    let issues: string[] = [];

    if (source === 'COMMERCIAL_TALLYPRIME') {
      // Extract from TallyPrime adapter synthetic offline transport
      tallyPrimeCommercialAdapter.executeSyntheticSync(productsDb).then(result => {
        if (!result.success) {
          return res.status(400).json({
            statusCode: 400,
            error: 'TALLYPRIME_SYNC_ERROR',
            message: 'Failed to extract items from Commercial TallyPrime adapter.',
            details: result.errors
          });
        }
        const createResult = accountingSyncEngine.createPriceSyncBatch('COMMERCIAL_TALLYPRIME', result.productPriceItems, user);
        if (createResult.error) {
          return res.status(400).json({ statusCode: 400, error: 'BATCH_CREATION_FAILED', message: createResult.error });
        }
        res.status(201).json({ statusCode: 201, success: true, batch: createResult.batch });
      });
      return;
    } else {
      // Default: BUILTIN_TALLY
      const extracted = builtinTallyAdapter.extractProductPriceSyncItems(productsDb, proposedPriceOverrides);
      items = extracted.items;
      issues = extracted.validationErrors;

      const createResult = accountingSyncEngine.createPriceSyncBatch('BUILTIN_TALLY', items, user);
      if (createResult.error) {
        return res.status(400).json({ statusCode: 400, error: 'BATCH_CREATION_FAILED', message: createResult.error });
      }

      res.status(201).json({
        statusCode: 201,
        success: true,
        batch: createResult.batch,
        validationIssues: [...new Set([...issues, ...(createResult.batch?.validationIssues || [])])]
      });
    }
  });

  // GET /batches - List all sync batches
  router.get('/batches', requireBackOffice, (req: Request, res: Response) => {
    const { status, source } = req.query;
    let batches = accountingSyncEngine.getBatches();

    if (status) {
      batches = batches.filter(b => b.status === status);
    }
    if (source) {
      batches = batches.filter(b => b.source === source);
    }

    res.json({ statusCode: 200, count: batches.length, batches });
  });

  // GET /batches/:id - Get specific batch details
  router.get('/batches/:id', requireBackOffice, (req: Request, res: Response) => {
    const batch = accountingSyncEngine.getBatchById(req.params.id);
    if (!batch) {
      return res.status(404).json({ statusCode: 404, error: 'Not Found', message: `Batch ${req.params.id} not found.` });
    }
    res.json({ statusCode: 200, batch });
  });

  // POST /batches/:id/decision - Approve or Reject batch (Dual-Control Maker-Checker)
  router.post('/batches/:id/decision', requireBackOffice, (req: Request, res: Response) => {
    const user = getAuthUser(req)!;
    const { decision, reasonNotes = '' } = req.body;

    if (decision !== 'APPROVED' && decision !== 'REJECTED') {
      return res.status(400).json({
        statusCode: 400,
        error: 'INVALID_DECISION',
        message: 'Decision must be either "APPROVED" or "REJECTED".'
      });
    }

    const result = accountingSyncEngine.decideBatch(req.params.id, decision, user, reasonNotes);
    if (!result.success) {
      return res.status(400).json({
        statusCode: 400,
        error: 'DECISION_FAILED',
        message: result.error
      });
    }

    res.json({
      statusCode: 200,
      success: true,
      batch: result.batch,
      message: `Batch ${req.params.id} successfully marked as ${decision}.`
    });
  });

  // POST /batches/:id/apply - Apply approved sync batch (Prices, Inventory Batches, or Ledgers)
  router.post('/batches/:id/apply', requireBackOffice, async (req: Request, res: Response) => {
    const user = getAuthUser(req)!;
    const batch = accountingSyncEngine.getBatchById(req.params.id);
    if (!batch) {
      return res.status(404).json({ statusCode: 404, error: 'Not Found', message: `Batch ${req.params.id} not found.` });
    }

    let result;
    if (batch.batchType === 'INVENTORY_BATCH_SYNC') {
      result = await accountingSyncEngine.applyInventoryBatch(
        req.params.id,
        user,
        productsDb,
        inventoryMovementsDb
      );
    } else if (batch.batchType === 'LEDGER_OUTSTANDING_SYNC') {
      result = await accountingSyncEngine.applyCustomerLedgerSync(
        req.params.id,
        user
      );
    } else if (batch.batchType === 'PAYMENT_RECONCILIATION') {
      result = await accountingSyncEngine.applyPaymentReconciliationBatch(
        req.params.id,
        user
      );
    } else {
      // Default: PRICE_SYNC
      result = await accountingSyncEngine.applyPriceBatch(
        req.params.id,
        user,
        productsDb,
        ordersDb,
        invoicesDb,
        customerPriceRulesDb
      );
    }

    if (!result.success) {
      return res.status(400).json({
        statusCode: 400,
        error: 'APPLY_FAILED',
        message: result.error || 'Failed to apply batch.'
      });
    }

    res.json({
      statusCode: 200,
      success: true,
      appliedCount: result.appliedCount,
      details: result.details
    });
  });

  // POST /batches/:id/retry - Retry failed records
  router.post('/batches/:id/retry', requireBackOffice, (req: Request, res: Response) => {
    const user = getAuthUser(req)!;
    const batch = accountingSyncEngine.getBatchById(req.params.id);
    if (!batch) {
      return res.status(404).json({ statusCode: 404, error: 'Not Found', message: `Batch ${req.params.id} not found.` });
    }

    if (batch.status === 'FAILED') {
      batch.status = 'PENDING_APPROVAL';
      batch.auditTrail.push({
        action: 'BATCH_RETRY_INITIATED',
        actor: `${user.name} (${user.role})`,
        timestamp: new Date().toISOString(),
        details: 'Batch reset to PENDING_APPROVAL for re-validation and review.'
      });
      return res.json({ statusCode: 200, success: true, message: 'Batch successfully queued for retry review.', batch });
    }

    res.status(400).json({ statusCode: 400, error: 'INVALID_STATUS', message: `Only FAILED batches can be retried. Current status is ${batch.status}.` });
  });

  // ---------------------------------------------------------------------------
  // 2. AUTHORITATIVE CUSTOMER OUTSTANDING (With Customer Isolation)
  // ---------------------------------------------------------------------------
  router.get('/customers/:customerId/outstanding', (req: Request, res: Response) => {
    const user = getAuthUser(req);
    if (!user) {
      return res.status(401).json({ statusCode: 401, error: 'Unauthorized', message: 'Authentication required.' });
    }

    const reqCustomerId = req.params.customerId;

    // Strict Customer Isolation: Customer can only view their own ledger
    if (user.roleType === 'CUSTOMER') {
      if (reqCustomerId !== user.id && reqCustomerId !== user.labId) {
        return res.status(403).json({
          statusCode: 403,
          error: 'CUSTOMER_ISOLATION_VIOLATION',
          message: 'Access Denied: You cannot view financial records of another customer account.'
        });
      }
    }

    const snapshot = accountingSyncEngine.getCustomerOutstanding(reqCustomerId);
    res.json({ statusCode: 200, snapshot });
  });

  // ---------------------------------------------------------------------------
  // 3. PAYMENT LIFECYCLE (Online Gateway & Bank Transfer)
  // ---------------------------------------------------------------------------
  // POST /payments/online/initiate - Server-side payment intent creation
  router.post('/payments/online/initiate', (req: Request, res: Response) => {
    const user = getAuthUser(req);
    if (!user) {
      return res.status(401).json({ statusCode: 401, error: 'Unauthorized', message: 'Authentication required.' });
    }

    const { idempotencyKey, customerId, amount, currency = 'INR', allocations = [] } = req.body;
    const effectiveCustomerId = user.roleType === 'CUSTOMER' ? (user.labId || user.id) : (customerId || user.id);

    const result = accountingSyncEngine.initiateOnlinePayment({
      idempotencyKey,
      customerId: effectiveCustomerId,
      customerName: user.name,
      amount: Number(amount),
      currency,
      allocations,
      actor: { id: user.id, name: user.name }
    });

    if (result.error) {
      return res.status(400).json({ statusCode: 400, error: 'PAYMENT_INITIATION_FAILED', message: result.error });
    }

    res.status(201).json({ statusCode: 201, success: true, payment: result.payment });
  });

  // POST /payments/online/verify - Verify gateway signature independently
  router.post('/payments/online/verify', (req: Request, res: Response) => {
    const {
      paymentId,
      gatewayTransactionId,
      gatewaySignature,
      receivedAmount,
      receivedCurrency = 'INR',
      mockSignatureValid
    } = req.body;

    const result = accountingSyncEngine.verifyOnlinePayment({
      paymentId,
      gatewayTransactionId,
      gatewaySignature,
      receivedAmount: Number(receivedAmount),
      receivedCurrency,
      mockSignatureValid,
      invoicesDb
    });

    if (!result.success) {
      return res.status(400).json({
        statusCode: 400,
        error: 'PAYMENT_VERIFICATION_FAILED',
        message: result.error,
        payment: result.payment
      });
    }

    res.json({
      statusCode: 200,
      success: true,
      payment: result.payment,
      message: 'Payment verified and posted to accounting ledger.'
    });
  });

  // POST /payments/bank-transfer/submit - Customer submits proposed transfer
  router.post('/payments/bank-transfer/submit', (req: Request, res: Response) => {
    const user = getAuthUser(req);
    if (!user) {
      return res.status(401).json({ statusCode: 401, error: 'Unauthorized', message: 'Authentication required.' });
    }

    const {
      customerId,
      amount,
      currency = 'INR',
      bankReferenceNumber,
      bankName = 'HDFC Bank',
      evidenceNotes = '',
      allocations = []
    } = req.body;

    const effectiveCustomerId = user.roleType === 'CUSTOMER' ? (user.labId || user.id) : (customerId || user.id);

    const result = accountingSyncEngine.submitBankTransfer({
      customerId: effectiveCustomerId,
      customerName: user.name,
      amount: Number(amount),
      currency,
      bankReferenceNumber,
      bankName,
      evidenceNotes,
      allocations,
      submittedBy: { id: user.id, name: user.name }
    });

    if (result.error) {
      return res.status(400).json({ statusCode: 400, error: 'BANK_TRANSFER_SUBMIT_FAILED', message: result.error });
    }

    res.status(201).json({ statusCode: 201, success: true, payment: result.payment });
  });

  // POST /payments/bank-transfer/:id/verify - Back Office verifies bank transfer
  router.post('/payments/bank-transfer/:id/verify', requireBackOffice, (req: Request, res: Response) => {
    const user = getAuthUser(req)!;
    const { decision, reasonNotes = '' } = req.body;

    if (decision !== 'APPROVE' && decision !== 'REJECT') {
      return res.status(400).json({
        statusCode: 400,
        error: 'INVALID_DECISION',
        message: 'Decision must be either "APPROVE" or "REJECT".'
      });
    }

    const result = accountingSyncEngine.verifyBankTransfer({
      paymentId: req.params.id,
      verifiedBy: user,
      decision,
      reasonNotes,
      invoicesDb
    });

    if (!result.success) {
      return res.status(400).json({
        statusCode: 400,
        error: 'VERIFICATION_FAILED',
        message: result.error
      });
    }

    res.json({
      statusCode: 200,
      success: true,
      payment: result.payment,
      message: `Bank transfer ${req.params.id} ${decision === 'APPROVE' ? 'verified & posted' : 'rejected'}.`
    });
  });

  // GET /payments - List payments
  router.get('/payments', (req: Request, res: Response) => {
    const user = getAuthUser(req);
    if (!user) {
      return res.status(401).json({ statusCode: 401, error: 'Unauthorized', message: 'Authentication required.' });
    }

    let payments = accountingSyncEngine.getPayments();
    if (user.roleType === 'CUSTOMER') {
      const custId = user.labId || user.id;
      payments = payments.filter(p => p.customerId === custId);
    }

    res.json({ statusCode: 200, count: payments.length, payments });
  });

  // ---------------------------------------------------------------------------
  // 4. COMMERCIAL TALLYPRIME ADAPTER ENDPOINTS
  // ---------------------------------------------------------------------------
  router.get('/tallyprime/config', requireBackOffice, (_req: Request, res: Response) => {
    res.json({ statusCode: 200, config: tallyPrimeCommercialAdapter.getPublicConfig() });
  });

  router.post('/tallyprime/toggle', requireBackOffice, (req: Request, res: Response) => {
    const { enabled, format } = req.body;
    if (typeof enabled === 'boolean') {
      tallyPrimeCommercialAdapter.setEnabled(enabled);
    }
    if (format === 'XML' || format === 'JSON') {
      tallyPrimeCommercialAdapter.setFormat(format);
    }
    res.json({
      statusCode: 200,
      success: true,
      config: tallyPrimeCommercialAdapter.getPublicConfig()
    });
  });

  router.post('/tallyprime/test-sync', requireBackOffice, async (req: Request, res: Response) => {
    const { simulateTimeout, simulateMalformed, customPayload } = req.body;
    const result = await tallyPrimeCommercialAdapter.executeSyntheticSync(productsDb, {
      simulateTimeout,
      simulateMalformed,
      customPayload
    });
    res.json({ statusCode: 200, result });
  });

  // ---------------------------------------------------------------------------
  // 4B. EXTERNAL TALLY ERP (TALLY ERP 9 & TALLYPRIME) INTEGRATION SUITE
  // ---------------------------------------------------------------------------
  // Status & Connectivity
  router.get('/tally/status', requireBackOffice, async (_req: Request, res: Response) => {
    const status = await externalTallyAdapter.testConnection();
    res.json({ statusCode: 200, status });
  });

  router.get('/tally/config', requireBackOffice, (_req: Request, res: Response) => {
    res.json({ statusCode: 200, config: externalTallyAdapter.getPublicConfig() });
  });

  router.post('/tally/config', requireBackOffice, (req: Request, res: Response) => {
    const user = getAuthUser(req)!;
    
    // Strict Authorization: Enabling live mode or modifying network topology requires administrator privileges
    if (
      req.body.enabled === true ||
      req.body.environment === 'EXTERNAL_TALLY_HTTP' ||
      req.body.host !== undefined ||
      req.body.port !== undefined
    ) {
      if (user.roleType !== 'SUPER_ADMIN' && user.roleType !== 'OFFICE_ADMIN') {
        return res.status(403).json({
          statusCode: 403,
          error: 'INSUFFICIENT_PERMISSIONS',
          message: `Unauthorized: Role "${user.roleType}" is not permitted to enable external live mode or alter Tally network parameters. Administrator authorization (SUPER_ADMIN or OFFICE_ADMIN) is required.`
        });
      }
    }

    try {
      externalTallyAdapter.updateConfig(req.body);
      res.json({ statusCode: 200, success: true, config: externalTallyAdapter.getPublicConfig() });
    } catch (err: any) {
      res.status(400).json({
        statusCode: 400,
        error: 'CONFIG_VALIDATION_ERROR',
        message: err.message || 'Invalid configuration parameters.'
      });
    }
  });

  router.post('/tally/test-connection', requireBackOffice, async (_req: Request, res: Response) => {
    const status = await externalTallyAdapter.testConnection();
    res.json({ statusCode: 200, status });
  });

  // Inventory & Batch/Expiry Sync
  router.get('/tally/inventory-batches', requireBackOffice, (_req: Request, res: Response) => {
    res.json({
      statusCode: 200,
      count: externalTallyAdapter.getCachedInventoryBatches().length,
      batches: externalTallyAdapter.getCachedInventoryBatches()
    });
  });

  router.post('/tally/sync-inventory', requireBackOffice, async (req: Request, res: Response) => {
    const user = getAuthUser(req)!;
    const invResult = await externalTallyAdapter.fetchInventoryBatches(productsDb);
    if (!invResult.success && invResult.data.length === 0) {
      return res.status(400).json({
        statusCode: 400,
        error: 'TALLY_INVENTORY_FETCH_FAILED',
        message: invResult.errors.join('; ') || 'Failed to fetch inventory from Tally.'
      });
    }

    const createResult = accountingSyncEngine.createInventoryBatchSync(
      invResult.sourceType,
      invResult.data,
      user
    );

    if (createResult.error) {
      return res.status(400).json({ statusCode: 400, error: 'BATCH_CREATION_FAILED', message: createResult.error });
    }

    res.status(201).json({
      statusCode: 201,
      success: true,
      batch: createResult.batch,
      summary: invResult.rawResponseSummary,
      warnings: invResult.warnings
    });
  });

  // Customer Ledgers & Outstanding Balance Sync
  router.get('/tally/customer-ledgers', requireBackOffice, (_req: Request, res: Response) => {
    res.json({
      statusCode: 200,
      count: externalTallyAdapter.getCachedCustomerLedgers().length,
      ledgers: externalTallyAdapter.getCachedCustomerLedgers()
    });
  });

  router.post('/tally/sync-ledgers', requireBackOffice, async (req: Request, res: Response) => {
    const user = getAuthUser(req)!;
    const ledgerResult = await externalTallyAdapter.fetchCustomerLedgers();
    
    const createResult = accountingSyncEngine.createCustomerLedgerSync(
      ledgerResult.sourceType,
      ledgerResult.data,
      user
    );

    if (createResult.error) {
      return res.status(400).json({ statusCode: 400, error: 'BATCH_CREATION_FAILED', message: createResult.error });
    }

    res.status(201).json({
      statusCode: 201,
      success: true,
      batch: createResult.batch,
      summary: ledgerResult.rawResponseSummary,
      warnings: ledgerResult.warnings
    });
  });

  // Discrepancies
  router.get('/tally/discrepancies', requireBackOffice, (_req: Request, res: Response) => {
    const discrepancies = externalTallyAdapter.getCachedDiscrepancies();
    res.json({ statusCode: 200, count: discrepancies.length, discrepancies });
  });

  // Inbound Receipt Vouchers Synchronization & Reconciliation
  router.get('/tally/receipt-vouchers', requireBackOffice, (_req: Request, res: Response) => {
    const vouchers = externalTallyAdapter.getCachedReceiptVouchers();
    res.json({ statusCode: 200, count: vouchers.length, vouchers });
  });

  router.post('/tally/sync-receipts', requireBackOffice, async (req: Request, res: Response) => {
    const user = getAuthUser(req)!;
    const internalPayments = accountingSyncEngine.getPayments();
    const result = await externalTallyAdapter.fetchReceiptVouchers(internalPayments);

    if (!result.success && result.data.length === 0) {
      return res.status(400).json({
        statusCode: 400,
        error: 'TALLY_RECEIPTS_FETCH_FAILED',
        message: result.errors.join('; ') || 'Failed to fetch receipt vouchers from Tally.'
      });
    }

    const createResult = accountingSyncEngine.createPaymentReconciliationBatch(
      result.sourceType,
      result.data,
      user
    );

    if (createResult.error) {
      return res.status(400).json({ statusCode: 400, error: 'BATCH_CREATION_FAILED', message: createResult.error });
    }

    res.status(201).json({
      statusCode: 201,
      success: true,
      batch: createResult.batch,
      summary: result.rawResponseSummary,
      warnings: result.warnings
    });
  });

  // Outbound Verified Receipt Export to Tally
  router.post('/tally/export-receipt', requireBackOffice, (req: Request, res: Response) => {
    if (externalTallyAdapter.getConfig().environment === 'OFFICE_TALLY_BRIDGE') {
      return res.status(403).json({
        statusCode: 403,
        error: 'BRIDGE_READ_ONLY_MODE',
        message: 'Security Policy: Office Tally Bridge operates in strictly READ-ONLY audit mode. Outbound voucher posting and accounting writes are strictly prohibited.'
      });
    }

    const { receiptNumber, receiptDate, customerLedgerName, bankLedgerName, amount, narration, transactionReference } = req.body;
    if (!receiptNumber || !amount || !customerLedgerName) {
      return res.status(400).json({
        statusCode: 400,
        error: 'INVALID_PAYLOAD',
        message: 'receiptNumber, amount, and customerLedgerName are mandatory.'
      });
    }

    const xmlPayload = externalTallyAdapter.generateReceiptXmlEnvelope({
      receiptNumber,
      receiptDate: receiptDate || new Date().toISOString().split('T')[0],
      customerLedgerName,
      bankLedgerName: bankLedgerName || 'HDFC Bank Ltd (Current A/c #9921)',
      amount: Number(amount),
      narration: narration || `Verified Customer Receipt ${receiptNumber}`,
      transactionReference
    });

    res.json({
      statusCode: 200,
      success: true,
      message: 'Generated standard Tally Voucher XML Envelope for Receipt import.',
      xmlEnvelope: xmlPayload
    });
  });

  // ---------------------------------------------------------------------------
  // 4C. OFFICE TALLY BRIDGE ADMINISTRATION (Render Back Office Controls)
  // ---------------------------------------------------------------------------
  router.post('/bridge/generate-pairing-key', requireBackOffice, (req: Request, res: Response) => {
    const user = getAuthUser(req)!;
    if (user.roleType !== 'SUPER_ADMIN' && user.roleType !== 'OFFICE_ADMIN') {
      return res.status(403).json({
        statusCode: 403,
        error: 'INSUFFICIENT_PERMISSIONS',
        message: 'Only SUPER_ADMIN or OFFICE_ADMIN can generate Office Tally Bridge pairing tokens.'
      });
    }

    const token = officeTallyBridgeManager.generatePairingToken(user);
    res.json({
      statusCode: 200,
      success: true,
      pairingToken: token
    });
  });

  router.get('/bridge/devices', requireBackOffice, (_req: Request, res: Response) => {
    const devices = officeTallyBridgeManager.getPublicDevicesList();
    res.json({
      statusCode: 200,
      count: devices.length,
      devices
    });
  });

  router.post('/bridge/devices/:id/revoke', requireBackOffice, (req: Request, res: Response) => {
    const user = getAuthUser(req)!;
    if (user.roleType !== 'SUPER_ADMIN' && user.roleType !== 'OFFICE_ADMIN') {
      return res.status(403).json({
        statusCode: 403,
        error: 'INSUFFICIENT_PERMISSIONS',
        message: 'Only SUPER_ADMIN or OFFICE_ADMIN can revoke paired bridge devices.'
      });
    }

    const result = officeTallyBridgeManager.revokeDevice(req.params.id);
    if (!result.success) {
      return res.status(400).json({
        statusCode: 400,
        error: 'REVOCATION_FAILED',
        message: result.error
      });
    }

    res.json({
      statusCode: 200,
      success: true,
      message: `Device ${req.params.id} has been revoked immediately.`
    });
  });

  // ---------------------------------------------------------------------------
  // 5. AUDIT LOGS
  // ---------------------------------------------------------------------------
  router.get('/audit-logs', requireBackOffice, (_req: Request, res: Response) => {
    res.json({ statusCode: 200, auditLogs: accountingSyncEngine.getAuditLogs() });
  });

  return router;
}
