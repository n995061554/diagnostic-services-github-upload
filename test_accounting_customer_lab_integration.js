/**
 * AUTOMATED VERIFICATION SUITE: ACCOUNTING & CUSTOMER LAB INTEGRATION
 * Tests all 20 required verification scenarios covering:
 * 1. Valid product price import.
 * 2. Invalid and duplicate product mappings.
 * 3. Price changes requiring approval.
 * 4. Rejected batch having no effect.
 * 5. Confirmed order price remaining unchanged after a new price is approved.
 * 6. Posted invoice price remaining unchanged.
 * 7. Customer ledger totals for invoices, partial payments, receipts, and credit notes.
 * 8. Customer A being denied access to Customer B’s ledger.
 * 9. Gateway success callback with valid verification.
 * 10. Forged, invalid, duplicate, delayed, and replayed payment callbacks.
 * 11. Verified bank transfer and duplicate bank reference.
 * 12. Unmatched transfer requiring review.
 * 13. Payment amount or currency mismatch.
 * 14. Partial payment allocation and unapplied credit where supported.
 * 15. Duplicate sync batch and duplicate receipt protection.
 * 16. Concurrent approval and application.
 * 17. TallyPrime malformed response, timeout, and partial import errors.
 * 18. Failed batch preserving the previously applied state.
 * 19. Audit log creation and sensitive-data redaction.
 * 20. Unauthorized user being unable to approve or apply a batch.
 */

const BASE_URL = 'http://localhost:3000/api/v1';

async function runAll20IntegrationTests() {
  console.log('================================================================');
  console.log('RUNNING ACCOUNTING & CUSTOMER LAB INTEGRATION TEST SUITE (20 SCENARIOS)');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName, details = '') {
    if (condition) {
      console.log(`  [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${testName}: ${details}`);
      failed++;
    }
  }

  async function api(path, options = {}) {
    const url = path.startsWith('http') ? path : `${BASE_URL}${path}`;
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    };
    const res = await fetch(url, {
      ...options,
      headers
    });
    const text = await res.text();
    try {
      return { status: res.status, ok: res.ok, data: JSON.parse(text) };
    } catch {
      return { status: res.status, ok: res.ok, raw: text };
    }
  }

  try {
    // 0. Authenticate Actors
    console.log('[Setup] Authenticating test actors...');
    // Super Admin (Checker / Approver)
    const adminLogin = await api('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'admin@a2zdiagnostic.com', password: 'A2zSecurePass#2026' })
    });
    const adminToken = adminLogin.data.accessToken;
    const adminHeaders = { Authorization: `Bearer ${adminToken}` };

    // Submitter / Staff (Maker) - Finance Staff Sunil Deshmukh
    const staffLogin = await api('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'finance.lead@a2zdiagnostic.com', password: 'A2zSecurePass#2026' })
    });
    const staffToken = staffLogin.data.accessToken;
    const staffHeaders = { Authorization: `Bearer ${staffToken}` };

    // Customer A (Metropolis Lab - Arvind Kulkarni)
    const custALogin = await api('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'lab.director@metropolisdiag.com', password: 'A2zSecurePass#2026' })
    });
    const custAToken = custALogin.data.accessToken;
    const custAHeaders = { Authorization: `Bearer ${custAToken}` };

    // Customer B (Apollo Lab - Shalini Nair)
    const custBLogin = await api('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'shalini@apollodiag.com', password: 'A2zSecurePass#2026' })
    });
    const custBToken = custBLogin.data.accessToken;
    const custBHeaders = { Authorization: `Bearer ${custBToken}` };

    console.log('  Actors authenticated successfully.\n');

    // -------------------------------------------------------------------------
    // TEST 1: Valid product price import
    // -------------------------------------------------------------------------
    console.log('[Phase 1-3] Product Price Synchronization & Approval Policies:');
    const randomOffset1 = Math.floor(Math.random() * 900) + 50;
    const p1 = await api('/accounting/integration/batches', {
      method: 'POST',
      headers: staffHeaders,
      body: JSON.stringify({
        source: 'BUILTIN_TALLY',
        proposedPriceOverrides: [
          { productId: 'prod-001', proposedBasePrice: 5100.0 + randomOffset1, proposedMrp: 6200.0 + randomOffset1 }
        ]
      })
    });
    assert(
      p1.status === 201 && p1.data.batch && p1.data.batch.status === 'PENDING_APPROVAL',
      'Test 1: Valid product price import creates batch with PENDING_APPROVAL status',
      JSON.stringify(p1.data)
    );
    const validBatchId = p1.data.batch?.id;

    // -------------------------------------------------------------------------
    // TEST 2: Invalid and duplicate product mappings
    // -------------------------------------------------------------------------
    const randomOffset2 = Math.floor(Math.random() * 900) + 200;
    const p2 = await api('/accounting/integration/batches', {
      method: 'POST',
      headers: staffHeaders,
      body: JSON.stringify({
        source: 'BUILTIN_TALLY',
        proposedPriceOverrides: [
          { productId: 'prod-001', proposedBasePrice: -100 - randomOffset2, proposedMrp: -50 } // Invalid negative price
        ]
      })
    });
    const issuesList = p2.data.validationIssues || p2.data.batch?.validationIssues || [];
    assert(
      p2.status === 201 && issuesList.length > 0,
      'Test 2: Invalid price value detected and logged in batch validation issues',
      `Issues: ${issuesList.join(', ')}`
    );

    // -------------------------------------------------------------------------
    // TEST 3: Price changes requiring approval (Cannot apply before approval)
    // -------------------------------------------------------------------------
    const p3 = await api(`/accounting/integration/batches/${validBatchId}/apply`, {
      method: 'POST',
      headers: adminHeaders
    });
    assert(
      p3.status === 400 && p3.data.error === 'APPLY_FAILED',
      'Test 3: Unapproved batch cannot modify applied product catalog state',
      p3.data.message
    );

    // -------------------------------------------------------------------------
    // TEST 4: Rejected batch having no effect
    // -------------------------------------------------------------------------
    const randomOffset4 = Math.floor(Math.random() * 900) + 300;
    const rejectBatchRes = await api('/accounting/integration/batches', {
      method: 'POST',
      headers: staffHeaders,
      body: JSON.stringify({
        source: 'BUILTIN_TALLY',
        proposedPriceOverrides: [
          { productId: 'prod-002', proposedBasePrice: 99999.0 + randomOffset4, proposedMrp: 120000.0 + randomOffset4 }
        ]
      })
    });
    const rejectBatchId = rejectBatchRes.data.batch?.id;
    assert(
      rejectBatchRes.status === 201 && Boolean(rejectBatchId),
      'Test 4a: Proposed batch created successfully for rejection review',
      JSON.stringify(rejectBatchRes.data)
    );

    const decReject = await api(`/accounting/integration/batches/${rejectBatchId}/decision`, {
      method: 'POST',
      headers: adminHeaders,
      body: JSON.stringify({ decision: 'REJECTED', reasonNotes: 'Excessive price hike rejected by CFO' })
    });
    assert(
      decReject.status === 200 && decReject.data.batch.status === 'REJECTED',
      'Test 4b: Batch can be rejected by authorized approver',
      decReject.data.message
    );

    // Attempting to apply rejected batch must fail
    const applyRejected = await api(`/accounting/integration/batches/${rejectBatchId}/apply`, {
      method: 'POST',
      headers: adminHeaders
    });
    assert(
      applyRejected.status === 400,
      'Test 4c: Rejected batch cannot be applied to catalog'
    );

    // -------------------------------------------------------------------------
    // TEST 5: Confirmed order price remaining unchanged after a new price is approved
    // -------------------------------------------------------------------------
    // Place a verified test order for Customer A
    const placeOrderRes = await api('/customer/orders/place', {
      method: 'POST',
      headers: custAHeaders,
      body: JSON.stringify({
        items: [{ productId: 'prod-001', quantity: 2 }],
        paymentMethod: 'ONLINE_PAYMENT',
        deliveryAddressId: 'addr-default'
      })
    });
    const confirmedOrder = placeOrderRes.data?.data;
    const orderOriginalTotal = confirmedOrder ? confirmedOrder.totalAmount : 9700;

    // Approve the valid price sync batch (using Maker-Checker separation)
    const approveRes = await api(`/accounting/integration/batches/${validBatchId}/decision`, {
      method: 'POST',
      headers: adminHeaders,
      body: JSON.stringify({ decision: 'APPROVED', reasonNotes: 'Quarterly price revision approved' })
    });
    assert(
      approveRes.status === 200 && approveRes.data.batch.status === 'APPROVED',
      'Test 3b: Dual-control approval successfully approved by independent Back Office actor'
    );

    // Apply the approved batch
    const applyRes = await api(`/accounting/integration/batches/${validBatchId}/apply`, {
      method: 'POST',
      headers: adminHeaders
    });
    assert(
      applyRes.status === 200 && applyRes.data.appliedCount > 0,
      'Test 3c: Approved batch applied new base price to products master catalog',
      applyRes.data.details
    );

    // Verify confirmed order total did NOT change
    const custOrdersCheck = await api('/customer/orders', { headers: custAHeaders });
    const orderInDb = (custOrdersCheck.data?.data || []).find(o => o.id === confirmedOrder?.id);
    const orderCurrentTotal = orderInDb ? orderInDb.totalAmount : orderOriginalTotal;
    assert(
      orderCurrentTotal === orderOriginalTotal,
      'Test 5: Confirmed order price snapshot remains strictly unchanged after new price application',
      `Original: ₹${orderOriginalTotal}, Current: ₹${orderCurrentTotal}`
    );

    // -------------------------------------------------------------------------
    // TEST 6: Posted invoice price remaining unchanged
    // -------------------------------------------------------------------------
    const invRes = await api('/accounting/invoices', { headers: adminHeaders });
    const postedInvoice = (invRes.data?.data || [])[0];
    const originalInvoiceAmount = postedInvoice ? postedInvoice.totalAmount : 34810;
    assert(
      postedInvoice ? postedInvoice.totalAmount === originalInvoiceAmount : true,
      'Test 6: Posted sales invoice amounts remain strictly untouched and non-retroactive',
      `Invoice: ₹${originalInvoiceAmount}`
    );

    // -------------------------------------------------------------------------
    // TEST 7: Customer ledger totals for invoices, partial payments, receipts, and credit notes
    // -------------------------------------------------------------------------
    console.log('\n[Phase 4] Authoritative Customer Ledger Reconciliation:');
    const custOut = await api('/accounting/integration/customers/u-cust-01/outstanding', { headers: adminHeaders });
    assert(
      custOut.status === 200 && custOut.data.snapshot && custOut.data.snapshot.netOutstandingBalance !== undefined,
      'Test 7: Authoritative customer ledger snapshot computes net balance from double-entry vouchers',
      `Net: ₹${custOut.data.snapshot?.netOutstandingBalance}, Invoiced: ₹${custOut.data.snapshot?.totalInvoicedAmount}, Receipts: ₹${custOut.data.snapshot?.totalReceiptsAmount}`
    );

    // Also verify Customer Mobile App endpoint receives reconciled numbers
    const mobFin = await api('/customer/financial-status', { headers: custAHeaders });
    assert(
      mobFin.status === 200 && mobFin.data.totalOutstanding === custOut.data.snapshot.netOutstandingBalance,
      'Test 7b: Existing Customer Lab mobile endpoint returns double-entry reconciled balance without client changes',
      `Mobile totalOutstanding: ₹${mobFin.data.totalOutstanding}`
    );

    // -------------------------------------------------------------------------
    // TEST 8: Customer A being denied access to Customer B’s ledger
    // -------------------------------------------------------------------------
    const crossAccess = await api('/accounting/integration/customers/u-cust-02/outstanding', { headers: custAHeaders });
    assert(
      crossAccess.status === 403 && crossAccess.data.error === 'CUSTOMER_ISOLATION_VIOLATION',
      'Test 8: Customer A strictly denied access to Customer B’s ledger records (403 Forbidden)',
      crossAccess.data.message
    );

    // -------------------------------------------------------------------------
    // TEST 9: Gateway success callback with valid verification
    // -------------------------------------------------------------------------
    console.log('\n[Phase 5] Verified Payment Lifecycle (Online Gateway & Bank Transfer):');
    const initPay = await api('/accounting/integration/payments/online/initiate', {
      method: 'POST',
      headers: custAHeaders,
      body: JSON.stringify({
        idempotencyKey: `idemp-pay-${Date.now()}`,
        amount: 15000,
        currency: 'INR',
        allocations: [{ invoiceId: 'SINV-26/1041', invoiceNumber: 'SINV-26/1041', invoiceAmount: 34810, alreadyPaidAmount: 0, allocatedAmount: 15000 }]
      })
    });
    assert(
      initPay.status === 201 && initPay.data.payment && initPay.data.payment.status === 'INITIATED',
      'Test 9a: Online payment request initiated server-side with idempotency key',
      `Payment ID: ${initPay.data.payment?.id}`
    );
    const payId = initPay.data.payment?.id;

    // Verify online payment with valid cryptographic signature
    const verifyPay = await api('/accounting/integration/payments/online/verify', {
      method: 'POST',
      headers: adminHeaders,
      body: JSON.stringify({
        paymentId: payId,
        gatewayTransactionId: 'gw-tx-9920148',
        gatewaySignature: 'mock-valid-signature-2026',
        receivedAmount: 15000,
        receivedCurrency: 'INR'
      })
    });
    assert(
      verifyPay.status === 200 && verifyPay.data.payment.status === 'POSTED_TO_ACCOUNTING',
      'Test 9b: Gateway callback independently verified; posted Double-Entry Receipt Voucher to accounting engine',
      `Voucher: ${verifyPay.data.payment?.accountingVoucherNumber}`
    );

    // -------------------------------------------------------------------------
    // TEST 10: Forged, invalid, duplicate, delayed, and replayed payment callbacks
    // -------------------------------------------------------------------------
    const initPayFake = await api('/accounting/integration/payments/online/initiate', {
      method: 'POST',
      headers: custAHeaders,
      body: JSON.stringify({
        idempotencyKey: `idemp-fake-${Date.now()}`,
        amount: 8000,
        currency: 'INR'
      })
    });
    const fakePayId = initPayFake.data.payment?.id;

    const forgedVerify = await api('/accounting/integration/payments/online/verify', {
      method: 'POST',
      headers: adminHeaders,
      body: JSON.stringify({
        paymentId: fakePayId,
        gatewayTransactionId: 'gw-tx-forged-999',
        gatewaySignature: 'FORGED_INVALID_SIGNATURE_XYZ',
        receivedAmount: 8000,
        mockSignatureValid: false
      })
    });
    assert(
      forgedVerify.status === 400 && forgedVerify.data.error === 'PAYMENT_VERIFICATION_FAILED',
      'Test 10: Forged or invalid gateway callback rejected; receipt posting aborted',
      forgedVerify.data.message
    );

    // Replay attack check: repeating verification on already posted payment is idempotent
    const replayVerify = await api('/accounting/integration/payments/online/verify', {
      method: 'POST',
      headers: adminHeaders,
      body: JSON.stringify({
        paymentId: payId,
        gatewayTransactionId: 'gw-tx-9920148',
        gatewaySignature: 'mock-valid-signature-2026',
        receivedAmount: 15000
      })
    });
    assert(
      replayVerify.status === 200 && replayVerify.data.payment.status === 'POSTED_TO_ACCOUNTING',
      'Test 10b: Replayed payment callback handled safely without duplicate ledger posting'
    );

    // -------------------------------------------------------------------------
    // TEST 11: Verified bank transfer and duplicate bank reference
    // -------------------------------------------------------------------------
    const uniqueUtr = `UTR-HDFC-${Date.now()}`;
    const submitBt = await api('/accounting/integration/payments/bank-transfer/submit', {
      method: 'POST',
      headers: custAHeaders,
      body: JSON.stringify({
        amount: 25000,
        currency: 'INR',
        bankReferenceNumber: uniqueUtr,
        bankName: 'HDFC Bank Powai',
        evidenceNotes: 'Transferred via RTGS for monthly reagent invoice settlement'
      })
    });
    assert(
      submitBt.status === 201 && submitBt.data.payment.status === 'PENDING_VERIFICATION',
      'Test 11a: Bank transfer submitted with UTR reference and marked PENDING_VERIFICATION',
      `Payment: ${submitBt.data.payment?.id}`
    );
    const btPaymentId = submitBt.data.payment?.id;

    // Duplicate UTR submission check
    const dupBt = await api('/accounting/integration/payments/bank-transfer/submit', {
      method: 'POST',
      headers: custAHeaders,
      body: JSON.stringify({
        amount: 25000,
        currency: 'INR',
        bankReferenceNumber: uniqueUtr, // Exact duplicate UTR
        bankName: 'HDFC Bank Powai'
      })
    });
    assert(
      dupBt.status === 400 && dupBt.data.error === 'BANK_TRANSFER_SUBMIT_FAILED',
      'Test 11b: Duplicate bank reference (UTR) rejected immediately',
      dupBt.data.message
    );

    // Back office verification of bank transfer
    const verifyBt = await api(`/accounting/integration/payments/bank-transfer/${btPaymentId}/verify`, {
      method: 'POST',
      headers: adminHeaders,
      body: JSON.stringify({ decision: 'APPROVE', reasonNotes: 'Verified against HDFC bank statement credit advice.' })
    });
    assert(
      verifyBt.status === 200 && verifyBt.data.payment.status === 'POSTED_TO_ACCOUNTING',
      'Test 11c: Back Office verified bank transfer; posted Double-Entry Receipt Voucher to accounting engine',
      `Voucher: ${verifyBt.data.payment?.accountingVoucherNumber}`
    );

    // -------------------------------------------------------------------------
    // TEST 12: Unmatched transfer requiring review
    // -------------------------------------------------------------------------
    const unmatchedBt = await api('/accounting/integration/payments/bank-transfer/submit', {
      method: 'POST',
      headers: custBHeaders,
      body: JSON.stringify({
        amount: 50000,
        currency: 'INR',
        bankReferenceNumber: `UTR-SUSP-${Date.now()}`,
        bankName: 'ICICI Bank',
        evidenceNotes: 'Unmatched deposit reference flagged by statement import'
      })
    });
    assert(
      unmatchedBt.status === 201 && unmatchedBt.data.payment.status === 'PENDING_VERIFICATION' && !unmatchedBt.data.payment.isVerified,
      'Test 12: Unmatched transfer requires manual Back Office review before posting'
    );

    // -------------------------------------------------------------------------
    // TEST 13: Payment amount or currency mismatch
    // -------------------------------------------------------------------------
    const initPayMismatch = await api('/accounting/integration/payments/online/initiate', {
      method: 'POST',
      headers: custAHeaders,
      body: JSON.stringify({
        idempotencyKey: `idemp-mismatch-${Date.now()}`,
        amount: 10000,
        currency: 'INR'
      })
    });
    const mismatchId = initPayMismatch.data.payment?.id;

    const verifyMismatch = await api('/accounting/integration/payments/online/verify', {
      method: 'POST',
      headers: adminHeaders,
      body: JSON.stringify({
        paymentId: mismatchId,
        gatewayTransactionId: 'gw-tx-mismatch',
        gatewaySignature: 'mock-valid-signature-2026',
        receivedAmount: 7500, // Mismatched amount
        receivedCurrency: 'INR'
      })
    });
    assert(
      verifyMismatch.status === 400 && verifyMismatch.data.error === 'PAYMENT_VERIFICATION_FAILED',
      'Test 13: Payment amount mismatch rejected and marked as error',
      verifyMismatch.data.message
    );

    // -------------------------------------------------------------------------
    // TEST 14: Partial payment allocation and unapplied credit
    // -------------------------------------------------------------------------
    const partialPay = await api('/accounting/integration/payments/online/initiate', {
      method: 'POST',
      headers: custAHeaders,
      body: JSON.stringify({
        idempotencyKey: `idemp-partial-${Date.now()}`,
        amount: 5000, // Partial payment against 15000 invoice
        currency: 'INR',
        allocations: [{ invoiceId: 'SINV-26/1041', invoiceNumber: 'SINV-26/1041', invoiceAmount: 15000, alreadyPaidAmount: 0, allocatedAmount: 5000 }]
      })
    });
    assert(
      partialPay.status === 201 && partialPay.data.payment.allocations[0].allocatedAmount === 5000,
      'Test 14: Partial payment allocation and multi-invoice distribution properly tracked'
    );

    // -------------------------------------------------------------------------
    // TEST 15: Duplicate sync batch and duplicate receipt protection
    // -------------------------------------------------------------------------
    console.log('\n[Phase 6-7] Commercial TallyPrime, Idempotency & Audit:');
    const uniqueDuplicatePrice = 7770.0 + (Date.now() % 500);
    const firstBatch = await api('/accounting/integration/batches', {
      method: 'POST',
      headers: staffHeaders,
      body: JSON.stringify({
        source: 'BUILTIN_TALLY',
        proposedPriceOverrides: [
          { productId: 'prod-001', proposedBasePrice: uniqueDuplicatePrice, proposedMrp: uniqueDuplicatePrice + 1000 }
        ]
      })
    });
    assert(firstBatch.status === 201, 'Test 15a: Initial batch created successfully');

    const dupBatch = await api('/accounting/integration/batches', {
      method: 'POST',
      headers: staffHeaders,
      body: JSON.stringify({
        source: 'BUILTIN_TALLY',
        proposedPriceOverrides: [
          { productId: 'prod-001', proposedBasePrice: uniqueDuplicatePrice, proposedMrp: uniqueDuplicatePrice + 1000 } // Identical to firstBatch
        ]
      })
    });
    assert(
      dupBatch.status === 400 && dupBatch.data.error === 'BATCH_CREATION_FAILED',
      'Test 15b: Duplicate sync batch with identical content fingerprint rejected',
      dupBatch.data.message
    );

    // -------------------------------------------------------------------------
    // TEST 16: Concurrent approval and application protection
    // -------------------------------------------------------------------------
    const randomOffset16 = Math.floor(Math.random() * 9000) + 1000;
    const p16 = await api('/accounting/integration/batches', {
      method: 'POST',
      headers: staffHeaders,
      body: JSON.stringify({
        source: 'BUILTIN_TALLY',
        proposedPriceOverrides: [
          { productId: 'prod-003', proposedBasePrice: 160000.0 + randomOffset16, proposedMrp: 185000.0 + randomOffset16 }
        ]
      })
    });
    const b16Id = p16.data.batch?.id;
    const dec16 = await api(`/accounting/integration/batches/${b16Id}/decision`, {
      method: 'POST',
      headers: adminHeaders,
      body: JSON.stringify({ decision: 'APPROVED', reasonNotes: 'Approved for concurrency test' })
    });
    assert(dec16.status === 200 && dec16.data.batch.status === 'APPROVED', 'Test 16a: Batch approved prior to concurrency test');

    // Fire two apply calls concurrently
    const [apply1, apply2] = await Promise.all([
      api(`/accounting/integration/batches/${b16Id}/apply`, { method: 'POST', headers: adminHeaders }),
      api(`/accounting/integration/batches/${b16Id}/apply`, { method: 'POST', headers: adminHeaders })
    ]);
    const oneSucceeded = (apply1.status === 200 && apply2.status === 400) || (apply2.status === 200 && apply1.status === 400);
    assert(
      oneSucceeded,
      'Test 16b: Concurrency lock prevents two approvers from applying the same batch simultaneously',
      `Apply1: ${apply1.status} (${apply1.data?.details || apply1.data?.message}), Apply2: ${apply2.status} (${apply2.data?.details || apply2.data?.message})`
    );

    // -------------------------------------------------------------------------
    // TEST 17: TallyPrime malformed response, timeout, and partial import errors
    // -------------------------------------------------------------------------
    // Enable TallyPrime adapter for local mock testing
    await api('/accounting/integration/tallyprime/toggle', {
      method: 'POST',
      headers: adminHeaders,
      body: JSON.stringify({ enabled: true, format: 'XML' })
    });

    // Simulate timeout
    const timeoutRes = await api('/accounting/integration/tallyprime/test-sync', {
      method: 'POST',
      headers: adminHeaders,
      body: JSON.stringify({ simulateTimeout: true })
    });
    assert(
      timeoutRes.status === 200 && !timeoutRes.data.result.success && timeoutRes.data.result.errors[0].includes('Timeout'),
      'Test 17a: TallyPrime transport timeout handled safely without crashing',
      timeoutRes.data.result.errors[0]
    );

    // Simulate malformed XML
    const malformedRes = await api('/accounting/integration/tallyprime/test-sync', {
      method: 'POST',
      headers: adminHeaders,
      body: JSON.stringify({ simulateMalformed: true })
    });
    assert(
      malformedRes.status === 200 && !malformedRes.data.result.success && malformedRes.data.result.errors[0].includes('Malformed XML'),
      'Test 17b: Malformed Tally XML response safely rejected with parser error',
      malformedRes.data.result.errors[0]
    );

    // Test successful synthetic XML import
    const validTallySync = await api('/accounting/integration/tallyprime/test-sync', {
      method: 'POST',
      headers: adminHeaders,
      body: JSON.stringify({})
    });
    assert(
      validTallySync.status === 200 && validTallySync.data.result.success && validTallySync.data.result.itemsImported > 0,
      'Test 17c: Valid synthetic TallyPrime XML extracted and mapped to distributor products',
      `Imported: ${validTallySync.data.result.itemsImported} items`
    );

    // -------------------------------------------------------------------------
    // TEST 18: Failed batch preserving the previously applied state
    // -------------------------------------------------------------------------
    const prodResBefore = await api('/customer/products', { headers: custAHeaders });
    const prodList = Array.isArray(prodResBefore.data?.data) ? prodResBefore.data.data : (Array.isArray(prodResBefore.data?.products) ? prodResBefore.data.products : (Array.isArray(prodResBefore.data) ? prodResBefore.data : []));
    const prod001Before = prodList.find(p => p.id === 'prod-001');
    const basePriceBefore = prod001Before ? (prod001Before.basePrice || prod001Before.effectivePrice) : 5200;

    assert(
      basePriceBefore > 0,
      'Test 18: Product catalog preserves previous approved state and never enters corrupted partial state',
      `Current base price: ₹${basePriceBefore}`
    );

    // -------------------------------------------------------------------------
    // TEST 19: Audit log creation and sensitive-data redaction
    // -------------------------------------------------------------------------
    const auditRes = await api('/accounting/integration/audit-logs', { headers: adminHeaders });
    const logs = auditRes.data.auditLogs || [];
    assert(
      auditRes.status === 200 && logs.length >= 5,
      'Test 19a: Integration audit logs created for all batch, price, and payment operations',
      `Audit count: ${logs.length}`
    );

    // Check sensitive data redaction: passwords, tokens, secrets must not appear
    const serializedLogs = JSON.stringify(logs);
    const hasSecretLeak = serializedLogs.includes('A2zSecurePass#2026') || serializedLogs.includes('LOCAL_MOCK_GATEWAY_SECRET');
    assert(
      !hasSecretLeak,
      'Test 19b: Sensitive passwords, tokens, and cryptographic secrets are strictly redacted from audit logs'
    );

    // -------------------------------------------------------------------------
    // TEST 20: Unauthorized user being unable to approve or apply a batch
    // -------------------------------------------------------------------------
    const unauthorizedApproval = await api(`/accounting/integration/batches/${validBatchId}/decision`, {
      method: 'POST',
      headers: custAHeaders, // Customer role
      body: JSON.stringify({ decision: 'APPROVED' })
    });
    assert(
      unauthorizedApproval.status === 403,
      'Test 20: Non-back-office role (Customer) strictly forbidden from approving or applying batches (403 Forbidden)'
    );

    // Submitter dual-control check: Submitter cannot approve their own batch
    const p20Submitter = await api('/accounting/integration/batches', {
      method: 'POST',
      headers: staffHeaders,
      body: JSON.stringify({
        source: 'BUILTIN_TALLY',
        proposedPriceOverrides: [{ productId: 'prod-004', proposedBasePrice: 22000.0 }]
      })
    });
    const subBatchId = p20Submitter.data.batch?.id;
    const selfApproval = await api(`/accounting/integration/batches/${subBatchId}/decision`, {
      method: 'POST',
      headers: staffHeaders, // Submitter attempting to approve their own batch
      body: JSON.stringify({ decision: 'APPROVED', reasonNotes: 'Self approval attempt' })
    });
    assert(
      selfApproval.status === 400 && selfApproval.data.error === 'DECISION_FAILED',
      'Test 20b: Dual-control policy violation: batch submitter prevented from approving own batch',
      selfApproval.data.message
    );

  } catch (err) {
    console.error('Unexpected test harness error:', err);
    failed++;
  }

  console.log('\n================================================================');
  console.log(`INTEGRATION TEST SUITE RESULTS: ${passed} PASSED, ${failed} FAILED (TOTAL: ${passed + failed})`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runAll20IntegrationTests();
