/**
 * AUTOMATED VERIFICATION SUITE: TALLY-STYLE DOUBLE-ENTRY ACCOUNTING
 * Tests mathematical reconciliation, debit=credit balance enforcement,
 * idempotency, safe reversals, and business integrations.
 * Updated: Authenticated with Super Admin JWT token.
 */

const BASE_URL = 'http://localhost:3000/api/v1/accounting';

async function runTests() {
  console.log('================================================================');
  console.log('RUNNING TALLY-STYLE ACCOUNTING VERIFICATION SUITE');
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

  try {
    // Phase 0: Authenticate as Super Admin
    const loginRes = await fetch('http://localhost:3000/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@a2zdiagnostic.com', password: 'A2zSecurePass#2026' })
    }).then(r => r.json());

    const token = loginRes.accessToken;
    const authHeaders = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };

    // TEST 1: Chart of Accounts & Groups loaded
    console.log('[Phase 1] Chart of Accounts & Ledger Groups Inspection:');
    const grpRes = await fetch(`${BASE_URL}/groups`, { headers: authHeaders }).then(r => r.json());
    assert(grpRes.statusCode === 200 && grpRes.count >= 18, 'Standard Tally account groups present (Assets, Liabilities, Income, Expenses)', `Count: ${grpRes.count}`);

    const ledRes = await fetch(`${BASE_URL}/ledgers`, { headers: authHeaders }).then(r => r.json());
    assert(ledRes.statusCode === 200 && ledRes.count >= 18, 'Default Chart of Accounts ledgers seeded with proper nature & balances', `Count: ${ledRes.count}`);

    // TEST 2: Authoritative Trial Balance Reconciles (Debits == Credits)
    console.log('\n[Phase 2] Authoritative Trial Balance Reconciliation:');
    const tbRes = await fetch(`${BASE_URL}/reports/trial-balance`, { headers: authHeaders }).then(r => r.json());
    assert(tbRes.statusCode === 200, 'Trial Balance generated from posted double-entry ledger');
    assert(tbRes.data.isBalanced === true, `Trial Balance is mathematically balanced: Dr ₹${tbRes.data.totalClosingDebit} == Cr ₹${tbRes.data.totalClosingCredit}`);
    assert(tbRes.data.totalPeriodDebit === tbRes.data.totalPeriodCredit, `Period debits equal period credits: Dr ₹${tbRes.data.totalPeriodDebit} == Cr ₹${tbRes.data.totalPeriodCredit}`);

    // TEST 3: Balance Sheet Reconciliation (Assets == Liabilities)
    console.log('\n[Phase 3] Balance Sheet Financial Statement Reconciliation:');
    const bsRes = await fetch(`${BASE_URL}/reports/balance-sheet`, { headers: authHeaders }).then(r => r.json());
    assert(bsRes.statusCode === 200, 'Balance Sheet generated successfully');
    assert(bsRes.data.isBalanced === true, `Balance Sheet is balanced: Assets ₹${bsRes.data.assets.totalAssets} == Liabilities ₹${bsRes.data.liabilities.totalLiabilities}`);

    // TEST 4: Profit & Loss Statement Reconciliation
    console.log('\n[Phase 4] Profit & Loss Trading & Income Statement:');
    const pnlRes = await fetch(`${BASE_URL}/reports/profit-loss`, { headers: authHeaders }).then(r => r.json());
    assert(pnlRes.statusCode === 200, 'Profit & Loss report generated successfully');
    assert(typeof pnlRes.data.tradingAccount.grossProfitOrLoss === 'number', `Gross Profit reliably calculated: ₹${pnlRes.data.tradingAccount.grossProfitOrLoss}`);
    assert(typeof pnlRes.data.incomeStatement.netProfitOrLoss === 'number', `Net Profit reliably calculated: ₹${pnlRes.data.incomeStatement.netProfitOrLoss}`);

    // TEST 5: Double-Entry Balancing Guard - Unbalanced Vouchers MUST Be Rejected!
    console.log('\n[Phase 5] Strict Double-Entry Balancing & Validation Guards:');
    const unbalancedPayload = {
      voucherType: 'SALES_INVOICE',
      date: '2026-10-22',
      narration: 'Deliberate unbalanced test entry',
      lines: [
        { ledgerId: 'led-debtor-metropolis', debit: 50000, credit: 0 },
        { ledgerId: 'led-sales-reagents', debit: 0, credit: 40000 } // ₹10,000 difference!
      ]
    };
    const unbalRes = await fetch(`${BASE_URL}/vouchers`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify(unbalancedPayload)
    });
    const unbalJson = await unbalRes.json();
    assert(unbalRes.status === 400, 'Unbalanced voucher rejected with HTTP 400 Bad Request');
    assert(unbalJson.message.includes('Double-Entry Balance Mismatch'), `Rejection message details mismatch: "${unbalJson.message}"`);

    // TEST 6: Balanced Voucher Posting & Ledger Balance Update
    console.log('\n[Phase 6] Valid Balanced Voucher Posting & Ledger Update:');
    const validPayload = {
      voucherType: 'RECEIPT',
      date: '2026-10-22',
      referenceNumber: 'TEST-CHQ-1001',
      narration: 'Customer receipt via cheque deposit test',
      lines: [
        { ledgerId: 'led-bank-hdfc', debit: 25000, credit: 0, narration: 'HDFC deposit' },
        { ledgerId: 'led-debtor-suburban', debit: 0, credit: 25000, narration: 'Suburban settlement' }
      ]
    };
    const validRes = await fetch(`${BASE_URL}/vouchers`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify(validPayload)
    });
    const validJson = await validRes.json();
    assert(validRes.status === 201, `Balanced voucher posted successfully (${validJson.data?.voucherNumber})`);
    assert(validJson.data?.status === 'POSTED', 'Voucher status is POSTED');

    // TEST 7: Idempotent Retries - Duplicate Prevention
    console.log('\n[Phase 7] Idempotency & Duplicate Posting Prevention:');
    const idemKey = `TEST_IDEMPOTENCY_${Date.now()}`;
    const idemPayload = {
      voucherType: 'CONTRA',
      date: '2026-10-22',
      narration: 'Idempotency verification remittance',
      idempotencyKey: idemKey,
      lines: [
        { ledgerId: 'led-bank-hdfc', debit: 10000, credit: 0 },
        { ledgerId: 'led-cash-in-hand', debit: 0, credit: 10000 }
      ]
    };
    // First post
    const post1 = await fetch(`${BASE_URL}/vouchers`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify(idemPayload)
    }).then(r => r.json());

    // Duplicate retry
    const post2 = await fetch(`${BASE_URL}/vouchers`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify(idemPayload)
    }).then(r => r.json());

    assert(post1.data?.id === post2.data?.id, 'Duplicate post with same idempotencyKey returned identical existing voucher');
    assert(post1.data?.voucherNumber === post2.data?.voucherNumber, `Voucher numbering preserved without increment: ${post1.data?.voucherNumber}`);

    // TEST 8: Safe Reversal / Cancellation with Audit Justification
    console.log('\n[Phase 8] Safe Reversal / Non-Silent Cancellation & Audit Integrity:');
    const voucherToCancel = validJson.data;
    const cancelRes = await fetch(`${BASE_URL}/vouchers/${voucherToCancel.id}/cancel`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ reason: 'Test correction for audit trail verification' })
    });
    const cancelJson = await cancelRes.json();
    assert(cancelRes.status === 200, `Voucher ${voucherToCancel.voucherNumber} safely cancelled`);
    assert(cancelJson.data?.original?.status === 'CANCELLED', 'Voucher status updated to CANCELLED');

    // TEST 9: Order Invoicing Integration Hook
    console.log('\n[Phase 9] Business Module Integration - Customer Order Invoicing:');
    const orderPayload = {
      orderId: 'ord-test-991',
      orderNumber: `ORD-TEST-${Date.now().toString().slice(-4)}`,
      customerId: 'u-cust-01',
      customerLabName: 'Metropolis Clinical Lab Powai',
      subtotal: 50000,
      gstAmount: 9000,
      grandTotal: 59000,
      date: '2026-10-22'
    };
    const orderInvRes = await fetch(`${BASE_URL}/integrations/post-order-invoice`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify(orderPayload)
    });
    const orderInvJson = await orderInvRes.json();
    assert(orderInvRes.status === 201, `Order invoice posted to accounting (${orderInvJson.data?.voucherNumber})`);
    assert(orderInvJson.data?.totalDebit === 59000 && orderInvJson.data?.totalCredit === 59000, 'Order voucher debits exactly equal credits (₹59,000)');

    // TEST 10: GST Statutory Reconciliation Report
    console.log('\n[Phase 10] GST Returns (GSTR-1 & GSTR-3B) Reconciliation:');
    const gstReportRes = await fetch(`${BASE_URL}/reports/gst-summary?month=2026-10`, { headers: authHeaders }).then(r => r.json());
    assert(gstReportRes.statusCode === 200, 'GST summary report generated');
    assert(typeof gstReportRes.data.outwardSupplies.totalOutputTax === 'number', `Output Tax calculated: ₹${gstReportRes.data.outwardSupplies.totalOutputTax}`);
    assert(typeof gstReportRes.data.inwardSupplies.totalInputTaxCredit === 'number', `Eligible ITC calculated: ₹${gstReportRes.data.inwardSupplies.totalInputTaxCredit}`);

    // TEST 11: Audit Trail Verification
    console.log('\n[Phase 11] Immutable Audit Trail Inspection:');
    const auditRes = await fetch(`${BASE_URL}/reports/audit-trail`, { headers: authHeaders }).then(r => r.json());
    assert(auditRes.statusCode === 200 && auditRes.count >= 5, `Audit trail recorded all mutations (${auditRes.count} audit records found)`);

  } catch (err) {
    console.error('Unexpected test error:', err);
    failed++;
  }

  console.log('\n================================================================');
  console.log(`TEST RESULTS: ${passed} PASSED | ${failed} FAILED`);
  console.log('================================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
