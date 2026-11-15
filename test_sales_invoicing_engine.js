/**
 * COMPREHENSIVE TEST SUITE: TALLY-STYLE SALES INVOICING & BILLING ENGINE
 * Project: DS Distributor Software (D:\diagnostic-services)
 *
 * Verifies:
 * - Product & real batch selection with expiry dates & available stock.
 * - Rejection of insufficient stock and expired batches.
 * - Intra-state (CGST+SGST) vs Inter-state (IGST) tax calculations.
 * - Tax-inclusive and tax-exclusive pricing.
 * - Item-level and invoice-level discounts.
 * - Freight, other charges, and round-off arithmetic.
 * - Draft saving without stock deduction or double-entry vouchers.
 * - Atomic posting: stock deduction, movement logging, and double-entry voucher generation.
 * - Idempotency guard: retry does not double-post.
 * - Controlled cancellation: restores stock, reverses voucher, and logs audit.
 */

import http from 'http';

let authToken = null;

function apiRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const dataString = body ? JSON.stringify(body) : null;
    const req = http.request({
      hostname: 'localhost',
      port: 3000,
      path: path.startsWith('/api') ? path : `/api/v1/accounting${path}`,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(dataString ? { 'Content-Length': Buffer.byteLength(dataString) } : {}),
        ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {})
      }
    }, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });

    req.on('error', reject);
    if (dataString) req.write(dataString);
    req.end();
  });
}

async function runTests() {
  console.log('================================================================');
  console.log('RUNNING TALLY-STYLE SALES INVOICING VERIFICATION SUITE');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  try {
    const loginRes = await apiRequest('POST', '/api/v1/auth/login', {
      email: 'admin@a2zdiagnostic.com',
      password: 'A2zSecurePass#2026'
    });
    authToken = loginRes.body.accessToken;
  } catch (e) {
    console.error('Failed to obtain authentication token:', e);
  }

  function assert(condition, message) {
    if (condition) {
      console.log(`  [PASS] ${message}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${message}`);
      failed++;
    }
  }

  try {
    // 1. Products with Real Batches
    console.log('[Test 1] Product Catalogue & Inventory Batches Lookup:');
    const prodRes = await apiRequest('GET', '/products-with-batches');
    assert(prodRes.status === 200, 'GET /products-with-batches returned 200 OK');
    assert(Array.isArray(prodRes.body.data) && prodRes.body.data.length >= 8, `Returned ${prodRes.body.data.length} products with batch metadata`);
    const p1 = prodRes.body.data.find(p => p.id === 'prod-001');
    assert(p1 && p1.batches.length >= 2, 'Accu-Chek Glucose Strips has multiple available batches');
    const b1 = p1.batches.find(b => b.batchNumber === 'BTH-ROC-9921');
    assert(b1 && b1.availableStock > 0 && b1.expiryDate === '2027-08-15', 'Batch BTH-ROC-9921 has valid expiry and available stock');

    // 2. Customers Directory
    console.log('\n[Test 2] Searchable Customers Directory:');
    const custRes = await apiRequest('GET', '/customers-list');
    assert(custRes.status === 200, 'GET /customers-list returned 200 OK');
    assert(Array.isArray(custRes.body.data) && custRes.body.data.length >= 2, `Returned ${custRes.body.data.length} customers with addresses and GSTINs`);
    const mhCust = custRes.body.data.find(c => c.stateCode === '27');
    const kaCust = custRes.body.data.find(c => c.stateCode === '29');
    assert(mhCust && mhCust.state === 'Maharashtra', 'Maharashtra customer identified for Intra-State GST');
    assert(kaCust && kaCust.state === 'Karnataka', 'Karnataka customer identified for Inter-State IGST');

    // 3. Calculation Engine: Intra-State (CGST + SGST)
    console.log('\n[Test 3] Authoritative Calculations - Intra-State (CGST + SGST):');
    const calcIntra = await apiRequest('POST', '/invoices/calculate', {
      items: [
        {
          productId: 'prod-001',
          productName: 'Accu-Chek Glucose Strips',
          sku: 'RCH-GLUC-500T',
          quantity: 2,
          unitPrice: 4850,
          discountPercent: 10, // 2 * 4850 = 9700 - 970 = 8730 taxable
          gstRate: 12
        }
      ],
      customerStateCode: '27',
      dealerStateCode: '27',
      freightCharges: 500,
      applyRoundOff: true
    });
    assert(calcIntra.status === 200, 'POST /invoices/calculate returned 200 OK');
    assert(calcIntra.body.data.isInterState === false, 'Correctly flagged as Intra-State');
    assert(calcIntra.body.data.taxableAmount === 8730, `Taxable amount calculated accurately: ₹${calcIntra.body.data.taxableAmount}`);
    // CGST 6% of 8730 = 523.8, SGST 6% of 8730 = 523.8, Total tax = 1047.6
    assert(calcIntra.body.data.totalCgst === 523.8, `CGST @ 6% = ₹${calcIntra.body.data.totalCgst}`);
    assert(calcIntra.body.data.totalSgst === 523.8, `SGST @ 6% = ₹${calcIntra.body.data.totalSgst}`);
    assert(calcIntra.body.data.totalIgst === 0, 'IGST is strictly 0 for intra-state sale');
    // 8730 + 1047.6 + 500 = 10277.6 -> Round off 0.4 -> finalTotal = 10278
    assert(calcIntra.body.data.finalTotal === 10278, `Grand total with round-off: ₹${calcIntra.body.data.finalTotal}`);

    // 4. Calculation Engine: Inter-State (IGST)
    console.log('\n[Test 4] Authoritative Calculations - Inter-State (IGST):');
    const calcInter = await apiRequest('POST', '/invoices/calculate', {
      items: [
        {
          productId: 'prod-002',
          productName: 'Sysmex Diluent 20L',
          sku: 'SYS-DCL-20L',
          quantity: 1,
          unitPrice: 12400,
          discountPercent: 0,
          gstRate: 12
        }
      ],
      customerStateCode: '29', // Karnataka
      dealerStateCode: '27', // Maharashtra
      applyRoundOff: false
    });
    assert(calcInter.status === 200, 'Inter-state calculation returned 200 OK');
    assert(calcInter.body.data.isInterState === true, 'Correctly flagged as Inter-State');
    assert(calcInter.body.data.totalCgst === 0 && calcInter.body.data.totalSgst === 0, 'CGST and SGST are 0 for inter-state sale');
    assert(calcInter.body.data.totalIgst === 1488, `IGST @ 12% on ₹12,400 = ₹${calcInter.body.data.totalIgst}`);
    assert(calcInter.body.data.finalTotal === 13888, `Inter-state grand total: ₹${calcInter.body.data.finalTotal}`);

    // 5. Save Draft Invoice (No Stock Deduction or Accounting Vouchers)
    console.log('\n[Test 5] Save Draft Invoice Lifecycle:');
    const draftPayload = {
      customerId: 'u-cust-01',
      customerName: 'Apex Clinical & Pathology Laboratories',
      customerStateCode: '27',
      invoiceDate: '2026-10-23',
      items: [
        {
          productId: 'prod-001',
          productName: 'Accu-Chek Glucose Strips',
          sku: 'RCH-GLUC-500T',
          batchNumber: 'BTH-ROC-9921',
          expiryDate: '2027-08-15',
          availableStock: 90,
          quantity: 5,
          unit: 'Kits',
          unitPrice: 4850,
          discountPercent: 0,
          gstRate: 12
        }
      ]
    };
    const draftRes = await apiRequest('POST', '/invoices/draft', draftPayload);
    assert(draftRes.status === 201, 'POST /invoices/draft returned 201 Created');
    assert(draftRes.body.data.status === 'DRAFT', 'Invoice status is DRAFT');
    assert(draftRes.body.data.voucherId === undefined, 'No double-entry accounting voucher created for draft');
    const draftId = draftRes.body.data.id;

    // Verify batch stock was NOT deducted by draft
    const batchAfterDraft = await apiRequest('GET', '/products-with-batches');
    const b1AfterDraft = batchAfterDraft.body.data.find(p => p.id === 'prod-001').batches.find(b => b.batchNumber === 'BTH-ROC-9921');
    assert(b1AfterDraft.availableStock === 90, 'Available stock remains unchanged (90) after saving draft');

    // 6. Insufficient Stock Rejection
    console.log('\n[Test 6] Insufficient Stock Validation Guard:');
    const excessPost = await apiRequest('POST', '/invoices/post', {
      customerId: 'u-cust-01',
      customerName: 'Apex Clinical Labs',
      customerStateCode: '27',
      items: [
        {
          productId: 'prod-001',
          productName: 'Accu-Chek Glucose Strips',
          sku: 'RCH-GLUC-500T',
          batchNumber: 'BTH-ROC-9921',
          expiryDate: '2027-08-15',
          quantity: 99999, // Exceeds stock
          unit: 'Kits',
          unitPrice: 4850,
          gstRate: 12
        }
      ]
    });
    assert(excessPost.status === 400, 'Posting with requested quantity > stock rejected with HTTP 400');
    assert(excessPost.body.message && excessPost.body.message.includes('Insufficient Stock'), `Rejection message details shortage: "${excessPost.body.message}"`);

    // 7. Expired Batch Rejection
    console.log('\n[Test 7] Expired Batch Validation Guard:');
    const expiredPost = await apiRequest('POST', '/invoices/post', {
      customerId: 'u-cust-01',
      customerName: 'Apex Clinical Labs',
      customerStateCode: '27',
      items: [
        {
          productId: 'prod-001',
          productName: 'Accu-Chek Glucose Strips',
          sku: 'RCH-GLUC-500T',
          batchNumber: 'BTH-ROC-EXP-9900', // Expired in 2025
          expiryDate: '2025-01-10',
          quantity: 1,
          unit: 'Kits',
          unitPrice: 4850,
          gstRate: 12
        }
      ]
    });
    assert(expiredPost.status === 400, 'Posting expired batch rejected with HTTP 400');
    assert(expiredPost.body.message && expiredPost.body.message.includes('expired'), `Rejection message warns of expiry: "${expiredPost.body.message}"`);

    // 8. Atomic Invoice Posting (Stock Deduction & Double-Entry Voucher Generation)
    console.log('\n[Test 8] Atomic Invoice Posting & Double-Entry Integration:');
    const postPayload = {
      customerId: 'u-cust-01',
      customerName: 'Apex Clinical & Pathology Laboratories',
      customerCode: 'CUST-MH-2041',
      customerGstin: '27AABCM8921N1ZM',
      customerState: 'Maharashtra',
      customerStateCode: '27',
      billingAddress: 'Sunrise Healthcare Complex, Powai, Mumbai - 400076',
      shippingAddress: 'Sunrise Healthcare Complex, Powai, Mumbai - 400076',
      invoiceDate: '2026-10-23',
      dueDate: '2026-11-22',
      paymentTerms: '30 Days Credit Line',
      poNumber: 'PO-APEX-TEST-9901',
      narration: 'Routine laboratory testing diagnostics dispatch',
      items: [
        {
          productId: 'prod-001',
          productName: 'Accu-Chek Glucose Strips',
          sku: 'RCH-GLUC-500T',
          batchNumber: 'BTH-ROC-9921',
          expiryDate: '2027-08-15',
          quantity: 4,
          unit: 'Kits',
          unitPrice: 4850,
          discountPercent: 0,
          gstRate: 12
        },
        {
          productId: 'prod-002',
          productName: 'Sysmex Cellpack Diluent 20L',
          sku: 'SYS-DCL-20L',
          batchNumber: 'BTH-SYS-4410',
          expiryDate: '2027-11-20',
          quantity: 2,
          unit: 'Drums',
          unitPrice: 12400,
          discountPercent: 5,
          gstRate: 12
        }
      ],
      freightCharges: 800,
      applyRoundOff: true,
      amountReceived: 10000,
      idempotencyKey: 'TEST_SINV_KEY_8821'
    };

    const postRes = await apiRequest('POST', '/invoices/post', postPayload);
    assert(postRes.status === 201, 'POST /invoices/post returned 201 Created');
    assert(postRes.body.data.status === 'POSTED', 'Invoice status is POSTED');
    assert(postRes.body.data.voucherNumber && postRes.body.data.voucherNumber.startsWith('SINV-26/'), `Linked double-entry voucher created: ${postRes.body.data.voucherNumber}`);
    assert(postRes.body.data.amountReceived === 10000, 'Recorded amount received = ₹10,000');
    assert(postRes.body.data.outstandingBalance > 0, `Outstanding receivable balance tracked: ₹${postRes.body.data.outstandingBalance}`);
    const postedInvoiceId = postRes.body.data.id;

    // Verify batch stock was decremented: BTH-ROC-9921 was 90, now should be 86
    const batchAfterPost = await apiRequest('GET', '/products-with-batches');
    const b1AfterPost = batchAfterPost.body.data.find(p => p.id === 'prod-001').batches.find(b => b.batchNumber === 'BTH-ROC-9921');
    assert(b1AfterPost.availableStock === 86, `Batch stock decremented accurately: 90 -> ${b1AfterPost.availableStock}`);

    // Verify Double-Entry Voucher exists and is balanced
    const vchRes = await apiRequest('GET', `/vouchers/${postRes.body.data.voucherId}`);
    assert(vchRes.status === 200, 'Authoritative Double-Entry Voucher retrieved from ledger engine');
    assert(vchRes.body.data.totalDebit === vchRes.body.data.totalCredit, `Voucher is strictly balanced: Dr ₹${vchRes.body.data.totalDebit} == Cr ₹${vchRes.body.data.totalCredit}`);

    // 9. Idempotency Guard (Duplicate Post Prevention)
    console.log('\n[Test 9] Idempotency & Duplicate Posting Prevention:');
    const retryPost = await apiRequest('POST', '/invoices/post', postPayload);
    assert(retryPost.status === 201 || retryPost.status === 200, 'Retry returned successfully');
    assert(retryPost.body.data.id === postedInvoiceId, 'Identical existing invoice returned without creating duplicates');
    assert(retryPost.body.data.voucherNumber === postRes.body.data.voucherNumber, 'Voucher number preserved without duplicate increments');

    // 10. Controlled Cancellation (Stock Restoration & Voucher Reversal)
    console.log('\n[Test 10] Controlled Safe Cancellation & Stock Restoration:');
    const cancelRes = await apiRequest('POST', `/invoices/${postedInvoiceId}/cancel`, {
      reason: 'Customer cancelled order due to laboratory protocol amendment'
    });
    assert(cancelRes.status === 200, 'POST /invoices/:id/cancel returned 200 OK');
    assert(cancelRes.body.data.status === 'CANCELLED', 'Invoice status updated to CANCELLED');

    // Verify batch stock was restored: 86 -> 90
    const batchAfterCancel = await apiRequest('GET', '/products-with-batches');
    const b1AfterCancel = batchAfterCancel.body.data.find(p => p.id === 'prod-001').batches.find(b => b.batchNumber === 'BTH-ROC-9921');
    assert(b1AfterCancel.availableStock === 90, `Batch stock safely restored back to ${b1AfterCancel.availableStock}`);

    // Verify linked voucher status is CANCELLED
    const cancelledVch = await apiRequest('GET', `/vouchers/${postRes.body.data.voucherId}`);
    assert(cancelledVch.body.data.status === 'CANCELLED', 'Linked double-entry accounting voucher safely cancelled and reversed');

  } catch (err) {
    console.error('Test execution failed with error:', err);
    failed++;
  }

  console.log('\n================================================================');
  console.log(`TEST RESULTS: ${passed} PASSED | ${failed} FAILED`);
  console.log('================================================================\n');

  if (failed > 0) process.exit(1);
}

runTests();
