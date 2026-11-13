/**
 * ACCOUNTING MODULE REST ROUTER
 * Project: Diagnostic Services (D:\diagnostic-services)
 *
 * Implements endpoints for Chart of Accounts, Vouchers, Double-Entry Posting,
 * Financial Reports, Bank Reconciliation, GST Reports, and Module Integrations.
 */

import { Router, Request, Response } from 'express';
import { accountingEngine } from './doubleEntryEngine.js';
import { salesInvoiceEngine } from './salesInvoiceEngine.js';
import { VoucherType, VoucherStatus } from './accountingTypes.js';

export function createAccountingRouter(
  inventoryMovementsDb?: any[],
  productsDb?: any[],
  usersDb?: any[]
): Router {
  const router = Router();

  // Helper to extract authenticated user & enforce accounting RBAC
  const getAuthUser = (req: Request) => {
    const u = (req as any).user;
    if (!u) return null;
    return {
      id: u.id,
      email: u.email,
      name: u.name || (u.firstName ? `${u.firstName} ${u.lastName || ''}`.trim() : (u.email || 'Authorized User')),
      role: u.roleType || u.role,
      roleType: u.roleType || u.role,
      roles: u.roles || [u.roleType || u.role]
    };
  };

  const requireAccountingAccess = (req: Request, res: Response, next: () => void) => {
    const user = getAuthUser(req);
    if (!user) {
      return res.status(401).json({
        statusCode: 401,
        error: 'Unauthorized',
        message: 'Authentication required. Missing or invalid Bearer token.'
      });
    }
    const allowed = ['SUPER_ADMIN', 'OFFICE_ADMIN', 'ACCOUNTS_STAFF', 'FINANCE_STAFF', 'AUTHORIZED_APPROVER'];
    if (!allowed.includes(user.roleType)) {
      return res.status(403).json({
        statusCode: 403,
        error: 'Forbidden',
        message: `Access restricted to authorized Accounts and Finance personnel. Role '${user.roleType}' lacks permission.`
      });
    }
    next();
  };

  router.use(requireAccountingAccess);

  // ============================================================================
  // 1. CHART OF ACCOUNTS & LEDGER GROUPS
  // ============================================================================

  router.get('/groups', (_req: Request, res: Response) => {
    const groups = accountingEngine.getGroups();
    res.json({ statusCode: 200, count: groups.length, data: groups });
  });

  router.get('/ledgers', (req: Request, res: Response) => {
    const { groupId, type, search } = req.query;
    let ledgers = accountingEngine.getLedgers();

    if (groupId) {
      ledgers = ledgers.filter(l => l.groupId === String(groupId));
    }
    if (type) {
      ledgers = ledgers.filter(l => l.accountType === String(type));
    }
    if (search) {
      const q = String(search).toLowerCase();
      ledgers = ledgers.filter(
        l => l.name.toLowerCase().includes(q) || l.accountNumber.toLowerCase().includes(q) || (l.gstin && l.gstin.toLowerCase().includes(q))
      );
    }

    res.json({ statusCode: 200, count: ledgers.length, data: ledgers });
  });

  router.get('/ledgers/:id', (req: Request, res: Response) => {
    const ledger = accountingEngine.getLedgerById(req.params.id);
    if (!ledger) {
      return res.status(404).json({ statusCode: 404, error: 'Not Found', message: 'Ledger account not found' });
    }
    res.json({ statusCode: 200, data: ledger });
  });

  router.post('/ledgers', (req: Request, res: Response) => {
    const user = getAuthUser(req);
    try {
      const newLedger = accountingEngine.createLedger(req.body, {
        id: user!.id,
        name: user!.name,
        role: user!.roleType
      });
      res.status(201).json({ statusCode: 201, message: 'Ledger account created successfully', data: newLedger });
    } catch (err: any) {
      res.status(400).json({ statusCode: 400, error: 'Bad Request', message: err.message });
    }
  });

  router.put('/ledgers/:id', (req: Request, res: Response) => {
    const user = getAuthUser(req);
    try {
      const updated = accountingEngine.updateLedger(req.params.id, req.body, {
        id: user!.id,
        name: user!.name,
        role: user!.roleType
      });
      res.json({ statusCode: 200, message: 'Ledger account updated successfully', data: updated });
    } catch (err: any) {
      res.status(400).json({ statusCode: 400, error: 'Bad Request', message: err.message });
    }
  });

  // ============================================================================
  // 2. VOUCHER ENTRY & OPERATIONS
  // ============================================================================

  router.get('/vouchers', (req: Request, res: Response) => {
    const { type, status, fromDate, toDate, ledgerId } = req.query;
    const vouchers = accountingEngine.getVouchers({
      type: type ? (String(type) as VoucherType) : undefined,
      status: status ? (String(status) as VoucherStatus) : undefined,
      fromDate: fromDate ? String(fromDate) : undefined,
      toDate: toDate ? String(toDate) : undefined,
      ledgerId: ledgerId ? String(ledgerId) : undefined
    });
    res.json({ statusCode: 200, count: vouchers.length, data: vouchers });
  });

  router.get('/vouchers/:id', (req: Request, res: Response) => {
    const voucher = accountingEngine.getVoucherById(req.params.id);
    if (!voucher) {
      return res.status(404).json({ statusCode: 404, error: 'Not Found', message: 'Voucher not found' });
    }
    res.json({ statusCode: 200, data: voucher });
  });

  router.post('/vouchers', (req: Request, res: Response) => {
    const user = getAuthUser(req);
    try {
      const postedVoucher = accountingEngine.postVoucher(req.body, {
        id: user!.id,
        name: user!.name,
        role: user!.roleType
      });
      res.status(201).json({
        statusCode: 201,
        message: `Voucher ${postedVoucher.voucherNumber} posted successfully.`,
        data: postedVoucher
      });
    } catch (err: any) {
      res.status(400).json({ statusCode: 400, error: 'Bad Request', message: err.message });
    }
  });

  router.post('/vouchers/:id/cancel', (req: Request, res: Response) => {
    const user = getAuthUser(req);
    if (!user || !['SUPER_ADMIN', 'OFFICE_ADMIN', 'FINANCE_STAFF'].includes(user.roleType)) {
      return res.status(403).json({
        statusCode: 403,
        error: 'Forbidden',
        message: 'Only Super Admin, Office Admin, or Finance Staff may cancel vouchers.'
      });
    }

    const { reason } = req.body;
    if (!reason || String(reason).trim().length === 0) {
      return res.status(400).json({
        statusCode: 400,
        error: 'Bad Request',
        message: 'Cancellation reason is mandatory for financial audit compliance.'
      });
    }

    try {
      const result = accountingEngine.cancelVoucher(req.params.id, reason, {
        id: user.id,
        name: user.name,
        role: user.roleType
      });
      res.json({
        statusCode: 200,
        message: `Voucher ${result.original.voucherNumber} cancelled and ledger entries reversed safely.`,
        data: result
      });
    } catch (err: any) {
      res.status(400).json({ statusCode: 400, error: 'Bad Request', message: err.message });
    }
  });

  // ============================================================================
  // 3. FINANCIAL REPORTS (All Reconciled Directly to Posted Ledger)
  // ============================================================================

  router.get('/reports/daybook', (req: Request, res: Response) => {
    const date = req.query.date ? String(req.query.date) : undefined;
    const entries = accountingEngine.generateDayBook(date);
    res.json({ statusCode: 200, count: entries.length, date: date || new Date().toISOString().split('T')[0], data: entries });
  });

  router.get('/reports/general-ledger/:ledgerId', (req: Request, res: Response) => {
    const { fromDate, toDate } = req.query;
    try {
      const report = accountingEngine.generateGeneralLedger(
        req.params.ledgerId,
        fromDate ? String(fromDate) : undefined,
        toDate ? String(toDate) : undefined
      );
      res.json({ statusCode: 200, data: report });
    } catch (err: any) {
      res.status(404).json({ statusCode: 404, error: 'Not Found', message: err.message });
    }
  });

  router.get('/reports/trial-balance', (req: Request, res: Response) => {
    const asOfDate = req.query.asOfDate ? String(req.query.asOfDate) : undefined;
    const report = accountingEngine.generateTrialBalance(asOfDate);
    res.json({ statusCode: 200, data: report });
  });

  router.get('/reports/profit-loss', (req: Request, res: Response) => {
    const fromDate = req.query.fromDate ? String(req.query.fromDate) : undefined;
    const toDate = req.query.toDate ? String(req.query.toDate) : undefined;
    const report = accountingEngine.generateProfitAndLoss(fromDate, toDate);
    res.json({ statusCode: 200, data: report });
  });

  router.get('/reports/balance-sheet', (req: Request, res: Response) => {
    const asOfDate = req.query.asOfDate ? String(req.query.asOfDate) : undefined;
    const report = accountingEngine.generateBalanceSheet(asOfDate);
    res.json({ statusCode: 200, data: report });
  });

  router.get('/reports/receivables-aging', (_req: Request, res: Response) => {
    const rows = accountingEngine.generateAgingAnalysis('DEBTOR');
    res.json({ statusCode: 200, count: rows.length, data: rows });
  });

  router.get('/reports/payables-aging', (_req: Request, res: Response) => {
    const rows = accountingEngine.generateAgingAnalysis('CREDITOR');
    res.json({ statusCode: 200, count: rows.length, data: rows });
  });

  router.get('/reports/gst-summary', (req: Request, res: Response) => {
    const month = req.query.month ? String(req.query.month) : undefined;
    const summary = accountingEngine.generateGstSummary(month);
    res.json({ statusCode: 200, data: summary });
  });

  router.get('/reports/audit-trail', (_req: Request, res: Response) => {
    const logs = accountingEngine.getAuditLogs();
    res.json({ statusCode: 200, count: logs.length, data: logs });
  });

  // ============================================================================
  // 4. ACCOUNTING & INVOICE SETTINGS
  // ============================================================================

  router.get('/settings', (_req: Request, res: Response) => {
    res.json({ statusCode: 200, data: accountingEngine.getSettings() });
  });

  router.put('/settings', (req: Request, res: Response) => {
    const user = getAuthUser(req);
    const adminRoles = ['SUPER_ADMIN', 'OFFICE_ADMIN', 'ACCOUNTS_STAFF', 'FINANCE_STAFF'];
    if (!user || !adminRoles.includes(user.roleType)) {
      return res.status(403).json({
        statusCode: 403,
        error: 'Forbidden',
        message: 'Only authorized administrators or finance staff may modify accounting and invoice configuration.'
      });
    }

    const updates = req.body;
    if (!updates || typeof updates !== 'object') {
      return res.status(400).json({ statusCode: 400, error: 'Bad Request', message: 'Valid configuration object required' });
    }

    try {
      const updated = accountingEngine.updateSettings(updates, {
        id: user.id,
        name: user.name || 'Admin User'
      });
      res.json({ statusCode: 200, message: 'Settings updated successfully', data: updated });
    } catch (err: any) {
      res.status(500).json({ statusCode: 500, error: 'Internal Server Error', message: err.message });
    }
  });

  router.get('/settings/next-number', (req: Request, res: Response) => {
    const docType = (req.query.docType as any) || 'TAX_INVOICE';
    const dateStr = (req.query.date as string) || new Date().toISOString().split('T')[0];
    try {
      const preview = salesInvoiceEngine.previewNextInvoiceNumber(docType, dateStr);
      res.json({ statusCode: 200, data: preview });
    } catch (err: any) {
      res.status(500).json({ statusCode: 500, error: 'Internal Server Error', message: err.message });
    }
  });

  // ============================================================================
  // 5. BUSINESS MODULE INTEGRATIONS (Single Source of Truth, Idempotent)
  // ============================================================================

  // Post Order Invoicing Voucher
  router.post('/integrations/post-order-invoice', (req: Request, res: Response) => {
    const user = getAuthUser(req);
    const { orderId, orderNumber, customerId, customerLabName, subtotal, gstAmount, grandTotal, date } = req.body;

    if (!orderNumber || !grandTotal) {
      return res.status(400).json({ statusCode: 400, error: 'Bad Request', message: 'orderNumber and grandTotal required' });
    }

    const idempotencyKey = `ORDER_INV_${orderNumber}`;

    // Find or fallback to debtor ledger
    const debtorLedger = accountingEngine.getLedgers().find(
      l => l.accountType === 'SUNDRY_DEBTOR' && (l.entityId === customerId || l.name.toLowerCase().includes((customerLabName || '').toLowerCase()))
    ) || accountingEngine.getLedgers().find(l => l.accountType === 'SUNDRY_DEBTOR')!;

    const tax = gstAmount || Math.round(subtotal * 0.18 * 100) / 100;
    const halfTax = Math.round((tax / 2) * 100) / 100;
    const taxable = subtotal || (grandTotal - tax);

    try {
      const voucher = accountingEngine.postVoucher(
        {
          voucherType: 'SALES_INVOICE',
          date: date || new Date().toISOString().split('T')[0],
          referenceNumber: orderNumber,
          narration: `Automatic sales invoice posting for customer order #${orderNumber} (${customerLabName || debtorLedger.name})`,
          lines: [
            {
              ledgerId: debtorLedger.id,
              debit: grandTotal,
              credit: 0,
              narration: `Receivable from ${debtorLedger.name}`
            },
            {
              ledgerId: 'led-sales-reagents',
              debit: 0,
              credit: taxable,
              taxableAmount: taxable,
              taxRatePercent: 18,
              narration: 'Reagents sales value'
            },
            {
              ledgerId: 'led-cgst-output',
              debit: 0,
              credit: halfTax,
              cgstAmount: halfTax,
              narration: 'Output CGST @ 9%'
            },
            {
              ledgerId: 'led-sgst-output',
              debit: 0,
              credit: halfTax,
              sgstAmount: halfTax,
              narration: 'Output SGST @ 9%'
            }
          ],
          entityType: 'CUSTOMER_ORDER',
          entityId: orderId || orderNumber,
          idempotencyKey
        },
        {
          id: user!.id,
          name: user!.name,
          role: user!.roleType
        }
      );

      res.status(201).json({
        statusCode: 201,
        message: `Order #${orderNumber} successfully posted to Accounting as Voucher ${voucher.voucherNumber}`,
        data: voucher
      });
    } catch (err: any) {
      res.status(400).json({ statusCode: 400, error: 'Bad Request', message: err.message });
    }
  });

  // Post Customer Payment Receipt
  router.post('/integrations/post-customer-receipt', (req: Request, res: Response) => {
    const user = getAuthUser(req);
    const { paymentId, customerId, customerLabName, amount, paymentMethod, bankName, referenceNumber, date } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ statusCode: 400, error: 'Bad Request', message: 'Valid positive amount required' });
    }

    const idempotencyKey = paymentId ? `PAY_RCPT_${paymentId}` : `PAY_RCPT_${Date.now()}`;

    const debtorLedger = accountingEngine.getLedgers().find(
      l => l.accountType === 'SUNDRY_DEBTOR' && (l.entityId === customerId || l.name.toLowerCase().includes((customerLabName || '').toLowerCase()))
    ) || accountingEngine.getLedgers().find(l => l.accountType === 'SUNDRY_DEBTOR')!;

    const isBank = (paymentMethod || '').toUpperCase() !== 'CASH';
    const depositLedgerId = isBank ? 'led-bank-hdfc' : 'led-cash-in-hand';

    try {
      const voucher = accountingEngine.postVoucher(
        {
          voucherType: 'RECEIPT',
          date: date || new Date().toISOString().split('T')[0],
          referenceNumber: referenceNumber || paymentId || 'NEFT-RECPT',
          narration: `Payment receipt from ${debtorLedger.name} via ${paymentMethod || 'BANK_TRANSFER'}`,
          bankName: isBank ? (bankName || 'HDFC Bank') : undefined,
          lines: [
            {
              ledgerId: depositLedgerId,
              debit: amount,
              credit: 0,
              narration: `Funds received into ${isBank ? 'Bank' : 'Cash Counter'}`
            },
            {
              ledgerId: debtorLedger.id,
              debit: 0,
              credit: amount,
              narration: `Settlement of receivables for ${debtorLedger.name}`
            }
          ],
          entityType: 'CUSTOMER_RECEIPT',
          entityId: paymentId,
          idempotencyKey
        },
        {
          id: user!.id,
          name: user!.name,
          role: user!.roleType
        }
      );

      res.status(201).json({
        statusCode: 201,
        message: `Receipt of ₹${amount} posted successfully as Voucher ${voucher.voucherNumber}`,
        data: voucher
      });
    } catch (err: any) {
      res.status(400).json({ statusCode: 400, error: 'Bad Request', message: err.message });
    }
  });

  // Post Approved Payroll Run to Accounting
  router.post('/integrations/post-payroll', (req: Request, res: Response) => {
    const user = getAuthUser(req);
    // Strict requirement: Only Super Admin can post approved payroll to accounting
    if (!user || user.roleType !== 'SUPER_ADMIN') {
      return res.status(403).json({
        statusCode: 403,
        error: 'Forbidden',
        message: 'Only Super Administrator is authorized to finalize and post approved payroll runs into Accounting.'
      });
    }

    const { payrollRunId, cycleMonth, totalGrossPayroll, totalNetDisbursement, staffCount, date } = req.body;
    if (!payrollRunId || !totalGrossPayroll || !totalNetDisbursement) {
      return res.status(400).json({ statusCode: 400, error: 'Bad Request', message: 'Missing payroll disbursement figures' });
    }

    const idempotencyKey = `PAYROLL_POST_${payrollRunId}`;
    const statutoryDeductions = Math.round((totalGrossPayroll - totalNetDisbursement) * 100) / 100;

    try {
      const voucher = accountingEngine.postVoucher(
        {
          voucherType: 'JOURNAL',
          date: date || new Date().toISOString().split('T')[0],
          referenceNumber: payrollRunId,
          narration: `Disbursement posting for ${cycleMonth || 'Current Month'} final payroll (${staffCount || 24} staff). Authorized by Super Admin.`,
          lines: [
            {
              ledgerId: 'led-salaries-wages',
              debit: totalGrossPayroll,
              credit: 0,
              narration: `Total Gross Salary Expense (${cycleMonth})`
            },
            {
              ledgerId: 'led-bank-hdfc',
              debit: 0,
              credit: totalNetDisbursement,
              narration: 'Net Salary Direct Bank Transfers'
            },
            {
              ledgerId: 'led-provisions',
              debit: 0,
              credit: statutoryDeductions,
              narration: 'Statutory PF, ESI, and Tax Deductions Withheld'
            }
          ],
          entityType: 'PAYROLL',
          entityId: payrollRunId,
          idempotencyKey
        },
        {
          id: user!.id,
          name: user!.name,
          role: 'SUPER_ADMIN'
        }
      );

      res.status(201).json({
        statusCode: 201,
        message: `Payroll run ${payrollRunId} successfully posted to Accounting as Journal Voucher ${voucher.voucherNumber}`,
        data: voucher
      });
    } catch (err: any) {
      res.status(400).json({ statusCode: 400, error: 'Bad Request', message: err.message });
    }
  });

  // ============================================================================
  // 6. PRODUCT-BASED SALES INVOICES & BILLING (TALLY-STYLE)
  // ============================================================================

  // 6.1 List Sales Invoices with Search & Filtering
  router.get('/invoices', (req: Request, res: Response) => {
    const { search, status, customerId, startDate, endDate, productId } = req.query;
    try {
      const invoices = salesInvoiceEngine.getInvoices({
        search: search ? String(search) : undefined,
        status: status ? String(status) : undefined,
        customerId: customerId ? String(customerId) : undefined,
        startDate: startDate ? String(startDate) : undefined,
        endDate: endDate ? String(endDate) : undefined,
        productId: productId ? String(productId) : undefined
      });

      res.json({
        statusCode: 200,
        count: invoices.length,
        data: invoices
      });
    } catch (err: any) {
      res.status(500).json({ statusCode: 500, error: 'Internal Server Error', message: err.message });
    }
  });

  // 6.2 Next Auto-Generated Invoice Number in Series
  router.get('/invoices/next-number', (_req: Request, res: Response) => {
    const nextNumber = salesInvoiceEngine.getNextInvoiceNumber();
    res.json({ statusCode: 200, nextInvoiceNumber: nextNumber });
  });

  // 6.3 Get Single Invoice by ID or Number
  router.get('/invoices/:id', (req: Request, res: Response) => {
    const invoice = salesInvoiceEngine.getInvoiceById(req.params.id);
    if (!invoice) {
      return res.status(404).json({ statusCode: 404, error: 'Not Found', message: 'Sales Invoice not found' });
    }
    res.json({ statusCode: 200, data: invoice });
  });

  // 6.4 Authoritative Decimal-Safe Calculations
  router.post('/invoices/calculate', (req: Request, res: Response) => {
    try {
      const settings = accountingEngine.getSettings();
      const dealerStateCode = settings.stateCode || '27';
      const calculation = salesInvoiceEngine.calculateInvoiceTotals({
        items: req.body.items || [],
        customerStateCode: req.body.customerStateCode || '27',
        dealerStateCode,
        invoiceDiscountType: req.body.invoiceDiscountType || 'FIXED',
        invoiceDiscountValue: Number(req.body.invoiceDiscountValue || 0),
        freightCharges: Number(req.body.freightCharges || 0),
        otherCharges: Number(req.body.otherCharges || 0),
        applyRoundOff: Boolean(req.body.applyRoundOff !== false),
        amountReceived: Number(req.body.amountReceived || 0)
      });

      res.json({ statusCode: 200, data: calculation });
    } catch (err: any) {
      res.status(400).json({ statusCode: 400, error: 'Calculation Error', message: err.message });
    }
  });

  // 6.5 Save Draft Invoice (No Stock Deduction or Accounting Vouchers)
  router.post('/invoices/draft', (req: Request, res: Response) => {
    const user = getAuthUser(req);
    try {
      const draft = salesInvoiceEngine.saveDraft(req.body, {
        id: user!.id,
        name: user!.name
      });
      res.status(201).json({
        statusCode: 201,
        message: `Draft invoice ${draft.invoiceNumber} saved successfully.`,
        data: draft
      });
    } catch (err: any) {
      res.status(400).json({ statusCode: 400, error: 'Bad Request', message: err.message });
    }
  });

  // 6.6 Post Sales Invoice (Atomic Validation, Stock Reduction & Double-Entry Posting)
  router.post('/invoices/post', async (req: Request, res: Response) => {
    const user = getAuthUser(req);
    try {
      const posted = await salesInvoiceEngine.postInvoiceSafe(
        req.body,
        {
          id: user!.id,
          name: user!.name,
          role: user!.roleType
        },
        inventoryMovementsDb,
        productsDb
      );

      res.status(201).json({
        statusCode: 201,
        message: `Sales Invoice ${posted.invoiceNumber} successfully posted! Inventory batches updated and Double-Entry Voucher ${posted.voucherNumber} created.`,
        data: posted
      });
    } catch (err: any) {
      res.status(400).json({ statusCode: 400, error: 'Posting Failed', message: err.message });
    }
  });

  // 6.7 Safe Cancellation with Stock Restoration & Double-Entry Reversal
  router.post('/invoices/:id/cancel', (req: Request, res: Response) => {
    const user = getAuthUser(req);
    if (!user || !['SUPER_ADMIN', 'OFFICE_ADMIN', 'FINANCE_STAFF'].includes(user.roleType)) {
      return res.status(403).json({
        statusCode: 403,
        error: 'Forbidden',
        message: 'Only Super Admin, Office Admin, or Finance Staff may cancel sales invoices.'
      });
    }

    const { reason } = req.body;
    try {
      const cancelled = salesInvoiceEngine.cancelInvoice(
        req.params.id,
        reason,
        {
          id: user.id,
          name: user.name,
          role: user.roleType
        },
        inventoryMovementsDb,
        productsDb
      );

      res.json({
        statusCode: 200,
        message: `Sales Invoice ${cancelled.invoiceNumber} cancelled safely. Inventory restored and double-entry voucher cancelled.`,
        data: cancelled
      });
    } catch (err: any) {
      res.status(400).json({ statusCode: 400, error: 'Cancellation Failed', message: err.message });
    }
  });

  // 6.8 Products Catalogue Enriched with Available Batches & Expiry Dates
  router.get('/products-with-batches', (_req: Request, res: Response) => {
    try {
      // Products from productsDb or fallback catalogue
      const defaultProducts = [
        {
          id: 'prod-001',
          sku: 'RCH-GLUC-500T',
          catalogNumber: '07224211190',
          name: 'Accu-Chek Inform II Reagent Glucose Test Strips',
          unit: 'Kits',
          hsnCode: '38220090',
          gstRate: 12.00,
          basePrice: 4850.00,
          mrp: 5800.00,
          isColdChain: true,
          storageTemperature: '2°C to 8°C'
        },
        {
          id: 'prod-002',
          sku: 'SYS-DCL-20L',
          catalogNumber: '954-0011-2',
          name: 'Sysmex CELLPACK DCL 20L Automated Hematology Diluent',
          unit: 'Drums',
          hsnCode: '38220090',
          gstRate: 12.00,
          basePrice: 12400.00,
          mrp: 14500.00,
          isColdChain: false,
          storageTemperature: '15°C to 25°C'
        },
        {
          id: 'prod-003',
          sku: 'TRA-CHEM7-EQ',
          catalogNumber: 'ERB-CHEM7-PLUS',
          name: 'Transasia Erba Chem 7 Semi-Automated Clinical Chemistry Analyzer',
          unit: 'Units',
          hsnCode: '90278090',
          gstRate: 18.00,
          basePrice: 165000.00,
          mrp: 195000.00,
          isColdChain: false,
          storageTemperature: 'Ambient (15°C to 30°C)'
        },
        {
          id: 'prod-004',
          sku: 'ABT-TROP-CAL',
          catalogNumber: '2K47-01',
          name: 'Abbott Architect High-Sensitive Troponin-I Calibrator Set',
          unit: 'Vials',
          hsnCode: '38220090',
          gstRate: 12.00,
          basePrice: 8900.00,
          mrp: 10500.00,
          isColdChain: true,
          storageTemperature: '-20°C Deep Freeze'
        },
        {
          id: 'prod-005',
          sku: 'BR-IMM-QC3',
          catalogNumber: '360-X',
          name: 'Bio-Rad Liquichek Immunology Quality Control Level 1-2-3',
          unit: 'Kits',
          hsnCode: '38220090',
          gstRate: 12.00,
          basePrice: 18200.00,
          mrp: 21000.00,
          isColdChain: true,
          storageTemperature: '2°C to 8°C'
        },
        {
          id: 'prod-006',
          sku: 'VAC-EDTA-3ML',
          catalogNumber: 'A2Z-EDTA-K2-3',
          name: 'VacuGuard K2 EDTA Blood Collection Tubes (Lavender Cap, 3.0 mL)',
          unit: 'Racks',
          hsnCode: '38220090',
          gstRate: 12.00,
          basePrice: 650.00,
          mrp: 850.00,
          isColdChain: false,
          storageTemperature: '4°C to 25°C'
        },
        {
          id: 'prod-007',
          sku: 'ERB-SGPT-ALT',
          catalogNumber: '120202',
          name: 'Erba SGPT / ALT Liquid Stable Kinetic Reagent Kit',
          unit: 'Kits',
          hsnCode: '38220090',
          gstRate: 12.00,
          basePrice: 1950.00,
          mrp: 2350.00,
          isColdChain: true,
          storageTemperature: '2°C to 8°C'
        },
        {
          id: 'prod-008',
          sku: 'SD-DENG-DUO',
          catalogNumber: '11EK50',
          name: 'Standard Q Dengue Duo NS1 + IgG/IgM Rapid Test Cards',
          unit: 'Boxes',
          hsnCode: '38220090',
          gstRate: 12.00,
          basePrice: 3800.00,
          mrp: 4600.00,
          isColdChain: false,
          storageTemperature: '2°C to 30°C'
        }
      ];

      const rawProducts = (productsDb && productsDb.length > 0) ? productsDb : defaultProducts;

      const enriched = rawProducts.map((p: any) => {
        const batches = salesInvoiceEngine.getBatchesForProduct(p.id);
        const totalStock = batches.reduce((sum, b) => sum + b.availableStock, 0);
        return {
          id: p.id,
          sku: p.sku,
          catalogNumber: p.catalogNumber,
          name: p.name,
          unit: p.unit || p.packSize || 'Units',
          hsnCode: p.hsnCode || '38220090',
          gstRate: Number(p.gstRate || 12.00),
          basePrice: Number(p.basePrice || 0),
          mrp: Number(p.mrp || 0),
          isColdChain: Boolean(p.isColdChain),
          storageTemperature: p.storageTemperature || 'Ambient',
          totalStock,
          batches
        };
      });

      res.json({ statusCode: 200, count: enriched.length, data: enriched });
    } catch (err: any) {
      res.status(500).json({ statusCode: 500, error: 'Internal Server Error', message: err.message });
    }
  });

  // 6.9 Searchable Customers Directory for Billing
  router.get('/customers-list', (_req: Request, res: Response) => {
    try {
      const defaultCustomers = [
        {
          id: 'u-cust-01',
          labName: 'Apex Clinical & Pathology Laboratories',
          customerCode: 'CUST-MH-2041',
          contactPerson: 'Dr. Arvind Kulkarni',
          email: 'lab.director@metropolisdiag.com',
          phone: '+919876543212',
          billingAddress: 'Ground Floor, Sunrise Healthcare Complex, LBS Marg, Powai, Mumbai - 400076',
          shippingAddress: 'Ground Floor, Sunrise Healthcare Complex, LBS Marg, Powai, Mumbai - 400076',
          gstNumber: '27AABCM8921N1ZM',
          panNumber: 'AABCM8921N',
          state: 'Maharashtra',
          stateCode: '27',
          paymentTerms: '30 Days Credit Line',
          creditLimit: 500000.00,
          currentOutstanding: 125000.00
        },
        {
          id: 'u-cust-02',
          labName: 'Apollo Diagnostic & Research Hub',
          customerCode: 'CUST-KA-8812',
          contactPerson: 'Dr. Shalini Nair',
          email: 'shalini@apollodiag.com',
          phone: '+919876543220',
          billingAddress: '4th Block, 80 Feet Road, Koramangala, Bengaluru, Karnataka - 560034',
          shippingAddress: 'Central Specimen Reception, 4th Block, Koramangala, Bengaluru - 560034',
          gstNumber: '29AADCA9918M1ZG',
          panNumber: 'AADCA9918M',
          state: 'Karnataka',
          stateCode: '29',
          paymentTerms: '60 Days Credit Line',
          creditLimit: 500000.00,
          currentOutstanding: 78500.00
        },
        {
          id: 'u-cust-03',
          labName: 'Suburban Diagnostics Andheri',
          customerCode: 'CUST-MH-3309',
          contactPerson: 'Dr. Vikram Sethi',
          email: 'dr.vikram@suburbanhealth.in',
          phone: '+919876543221',
          billingAddress: 'Andheri East Metro Station Road, Andheri East, Mumbai, Maharashtra - 400069',
          shippingAddress: 'Andheri East Metro Station Road, Andheri East, Mumbai, Maharashtra - 400069',
          gstNumber: '27AAACS1124K1ZK',
          panNumber: 'AAACS1124K',
          state: 'Maharashtra',
          stateCode: '27',
          paymentTerms: '45 Days Credit Line',
          creditLimit: 400000.00,
          currentOutstanding: 45000.00
        }
      ];

      let list = defaultCustomers;
      if (usersDb && usersDb.length > 0) {
        const custUsers = usersDb.filter((u: any) => u.customerProfile || u.roleType === 'CUSTOMER');
        if (custUsers.length > 0) {
          list = custUsers.map((u: any) => {
            const prof = u.customerProfile || {};
            const state = prof.state || (u.branch?.includes('BENGALURU') ? 'Karnataka' : 'Maharashtra');
            const stateCode = state.toLowerCase().includes('karnataka') ? '29' : '27';
            return {
              id: u.id,
              labName: prof.labName || `${u.firstName || ''} ${u.lastName || ''} Laboratory`.trim(),
              customerCode: prof.customerCode || `CUST-${u.id}`,
              contactPerson: `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.username,
              email: u.email,
              phone: u.phoneNumber,
              billingAddress: u.labAddress || prof.addressLine1 || 'Mumbai, Maharashtra',
              shippingAddress: u.labAddress || prof.addressLine1 || 'Mumbai, Maharashtra',
              gstNumber: prof.gstNumber || '27AABCM8921N1ZM',
              panNumber: prof.panNumber || 'AABCM8921N',
              state,
              stateCode,
              paymentTerms: prof.creditPeriodDays ? `${prof.creditPeriodDays} Days Credit Line` : '30 Days Credit Line',
              creditLimit: Number(prof.creditLimit || 500000),
              currentOutstanding: Number(prof.currentOutstanding || 0)
            };
          });
        }
      }

      res.json({ statusCode: 200, count: list.length, data: list });
    } catch (err: any) {
      res.status(500).json({ statusCode: 500, error: 'Internal Server Error', message: err.message });
    }
  });

  return router;
}
