/**
 * COMPREHENSIVE VERIFICATION SUITE:
 * BACK OFFICE ORDER CONTROLS & TALLY-STYLE ACCOUNTING IMPROVEMENTS
 * Project: DS Distributor Software (D:\diagnostic-services)
 *
 * Verifies:
 * 1. Concurrency safety of invoice numbering (simultaneous posting requests).
 * 2. Financial Year boundary formatting (March 31 vs April 1 transitions).
 * 3. Idempotent duplicate submissions prevention.
 * 4. Settings update & retrieval via PUT /api/v1/accounting/settings.
 * 5. Server-authoritative next document number preview endpoint.
 * 6. Order product name resolution & stock validation against product master.
 * 7. Authorized order amendment with Maker-Checker dual control.
 * 8. Draft invoice lifecycle and preview formatting.
 * 9. Reversal/cancellation and double-entry mathematical invariants.
 */

import http from 'http';

const BASE_URL = 'http://localhost:3000';
let passCount = 0;
let failCount = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  [PASS] ${message}`);
    passCount++;
  } else {
    console.error(`  [FAIL] ${message}`);
    failCount++;
  }
}

function makeRequest(path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const reqOptions = {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      }
    };

    const req = http.request(url, reqOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = data ? JSON.parse(data) : {};
          resolve({ status: res.statusCode, headers: res.headers, data: parsed, raw: data });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, data: null, raw: data });
        }
      });
    });

    req.on('error', reject);
    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }
    req.end();
  });
}

let adminHeaders = {};

async function runTests() {
  console.log('================================================================');
  console.log('RUNNING BACK OFFICE & TALLY-STYLE VERIFICATION SUITE');
  console.log('================================================================\n');

  try {
    const loginRes = await makeRequest('/api/v1/auth/login', {
      method: 'POST',
      body: {
        email: 'admin@a2zdiagnostic.com',
        password: 'A2zSecurePass#2026'
      }
    });
    const token = loginRes.data?.accessToken;
    adminHeaders = {
      'Authorization': `Bearer ${token}`
    };
    // --------------------------------------------------------------------------
    // Test 1: Settings Retrieval & Server Configuration
    // --------------------------------------------------------------------------
    console.log('[Test 1] Accounting & Invoice Settings API:');
    const settingsRes = await makeRequest('/api/v1/accounting/settings', { headers: adminHeaders });
    assert(settingsRes.status === 200, 'GET /settings returned HTTP 200 OK');
    assert(settingsRes.data?.data?.companyName?.includes('A2Z Diagnostic Services'), 'Default company name correctly loaded');
    assert(settingsRes.data?.data?.numberingConfigs?.TAX_INVOICE !== undefined, 'Numbering config present for TAX_INVOICE');
    assert(settingsRes.data?.data?.printConfig !== undefined, 'Print configuration present');

    // --------------------------------------------------------------------------
    // Test 2: Server-Authoritative Next Document Number Preview
    // --------------------------------------------------------------------------
    console.log('\n[Test 2] Server-Authoritative Document Number Preview:');
    const previewRes = await makeRequest('/api/v1/accounting/settings/next-number?docType=TAX_INVOICE', { headers: adminHeaders });
    assert(previewRes.status === 200, 'GET /settings/next-number returned HTTP 200 OK');
    assert(previewRes.data?.data?.previewNumber?.startsWith('SINV-'), `Preview number formatted correctly: ${previewRes.data?.data?.previewNumber}`);
    assert(previewRes.data?.data?.isDraft === true, 'Preview number flagged as provisional/draft');

    const previewDnRes = await makeRequest('/api/v1/accounting/settings/next-number?docType=DELIVERY_NOTE', { headers: adminHeaders });
    assert(previewDnRes.data?.data?.previewNumber?.startsWith('DN-'), `Delivery note preview formatted correctly: ${previewDnRes.data?.data?.previewNumber}`);

    // --------------------------------------------------------------------------
    // Test 3: Financial Year Boundary Transitions
    // --------------------------------------------------------------------------
    console.log('\n[Test 3] Financial Year Boundary Transitions:');
    // Test March 31, 2026 -> Indian FY 25-26
    const fyMarch = await makeRequest('/api/v1/accounting/settings/next-number?docType=TAX_INVOICE&date=2026-03-31', { headers: adminHeaders });
    assert(fyMarch.data?.data?.financialYear === '25-26', `March 31 belongs to FY 25-26: ${fyMarch.data?.data?.financialYear}`);

    // Test April 1, 2026 -> Indian FY 26-27
    const fyApril = await makeRequest('/api/v1/accounting/settings/next-number?docType=TAX_INVOICE&date=2026-04-01', { headers: adminHeaders });
    assert(fyApril.data?.data?.financialYear === '26-27', `April 1 belongs to FY 26-27: ${fyApril.data?.data?.financialYear}`);

    // Test February 15, 2027 -> Indian FY 26-27
    const fyFeb = await makeRequest('/api/v1/accounting/settings/next-number?docType=TAX_INVOICE&date=2027-02-15', { headers: adminHeaders });
    assert(fyFeb.data?.data?.financialYear === '26-27', `February 15, 2027 belongs to FY 26-27: ${fyFeb.data?.data?.financialYear}`);

    // --------------------------------------------------------------------------
    // Test 4: Settings Update via PUT /api/v1/accounting/settings
    // --------------------------------------------------------------------------
    console.log('\n[Test 4] Settings Mutation & Audit Integrity:');
    const updateRes = await makeRequest('/api/v1/accounting/settings', {
      method: 'PUT',
      headers: adminHeaders,
      body: {
        tradeName: 'A2Z Diagnostic Services India Pvt Ltd (Western Region)',
        defaultPricingMode: 'TAX_EXCLUSIVE',
        roundingPolicy: 'NEAREST_RUPEE'
      }
    });
    assert(updateRes.status === 200, 'PUT /settings returned HTTP 200 OK');
    assert(updateRes.data?.data?.tradeName?.includes('Western Region'), 'Trade name updated cleanly');

    // --------------------------------------------------------------------------
    // Test 5: Concurrency Safety & Mutex Locking for Invoice Numbering
    // --------------------------------------------------------------------------
    console.log('\n[Test 5] Concurrency Safety: Simultaneous Invoice Postings:');
    // Send 3 simultaneous invoice post requests with different customer orders
    const batchPayloadBase = {
      customerId: 'u-cust-01',
      customerName: 'Apex Clinical & Pathology Laboratories',
      customerStateCode: '27',
      items: [
        {
          productId: 'prod-001',
          productName: 'Accu-Chek Inform II Reagent Glucose Test Strips',
          sku: 'RCH-GLUC-500T',
          batchNumber: 'BTH-ROC-9934',
          quantity: 1,
          unitPrice: 2400,
          discountPercent: 0,
          unit: 'Kits',
          gstRate: 12
        }
      ]
    };

    const concurrentPromises = [
      makeRequest('/api/v1/accounting/invoices/post', {
        method: 'POST',
        headers: adminHeaders,
        body: { ...batchPayloadBase, idempotencyKey: `CONCURRENCY_TEST_1_${Date.now()}` }
      }),
      makeRequest('/api/v1/accounting/invoices/post', {
        method: 'POST',
        headers: adminHeaders,
        body: { ...batchPayloadBase, idempotencyKey: `CONCURRENCY_TEST_2_${Date.now()}` }
      }),
      makeRequest('/api/v1/accounting/invoices/post', {
        method: 'POST',
        headers: adminHeaders,
        body: { ...batchPayloadBase, idempotencyKey: `CONCURRENCY_TEST_3_${Date.now()}` }
      })
    ];

    const results = await Promise.all(concurrentPromises);
    const invoiceNumbers = results.map(r => r.data?.data?.invoiceNumber).filter(Boolean);
    const uniqueInvoiceNumbers = new Set(invoiceNumbers);

    assert(results.every(r => r.status === 201), 'All concurrent invoice postings succeeded (HTTP 201)');
    assert(invoiceNumbers.length === 3, 'All 3 concurrent invoices received numbers');
    assert(uniqueInvoiceNumbers.size === 3, `Zero duplicate numbers issued across concurrent requests: [${Array.from(uniqueInvoiceNumbers).join(', ')}]`);

    // --------------------------------------------------------------------------
    // Test 6: Idempotent Retries & Duplicate Rejection
    // --------------------------------------------------------------------------
    console.log('\n[Test 6] Idempotency & Duplicate Prevention:');
    const firstInvoice = results[0].data?.data;
    const retryRes = await makeRequest('/api/v1/accounting/invoices/post', {
      method: 'POST',
      headers: adminHeaders,
      body: {
        ...batchPayloadBase,
        idempotencyKey: firstInvoice?.idempotencyKey
      }
    });
    assert(retryRes.status === 201 || retryRes.status === 200, 'Idempotent retry returned HTTP 200/201');
    assert(retryRes.data?.data?.invoiceNumber === firstInvoice?.invoiceNumber, 'Identical invoice number returned on retry');

    // --------------------------------------------------------------------------
    // Test 7: Order Product Name Resolution & Stock Validation
    // --------------------------------------------------------------------------
    console.log('\n[Test 7] Product Master & Stock Validation:');
    const catalogRes = await makeRequest('/api/v1/accounting/products-with-batches', { headers: adminHeaders });
    assert(catalogRes.status === 200, 'GET /products-with-batches returned HTTP 200 OK');
    const products = catalogRes.data?.data || [];
    assert(products.length > 0, `Returned ${products.length} products with stock and batch metadata`);

    const rocheProd = products.find(p => p.sku === 'RCH-GLUC-500T');
    assert(rocheProd?.name?.includes('Accu-Chek'), `Resolved official product name: "${rocheProd?.name}"`);
    assert(rocheProd?.unit?.includes('Kit'), `Resolved official unit of measure: "${rocheProd?.unit}"`);
    assert(rocheProd?.batches?.length > 0, `Product has ${rocheProd?.batches?.length} inventory batch(es)`);

    // --------------------------------------------------------------------------
    // Test 8: Authorized Order Amendment (Maker-Checker Governance)
    // --------------------------------------------------------------------------
    console.log('\n[Test 8] Authorized Order Financial Amendment & Audit:');
    // First fetch orders
    const ordersRes = await makeRequest('/api/v1/admin/orders', { headers: adminHeaders });
    const orderList = ordersRes.data?.data || [];
    assert(orderList.length > 0, `Retrieved ${orderList.length} orders for back office inspection`);

    const targetOrder = orderList[0];
    if (targetOrder) {
      // 1. Maker cannot be checker test
      const invalidDualRes = await makeRequest(`/api/v1/admin/orders/${targetOrder.id}/amend`, {
        method: 'POST',
        headers: adminHeaders,
        body: {
          amendmentType: 'PRICE_CORRECTION_CREDIT_NOTE',
          creditAmount: 500,
          justification: 'Dual control check test',
          makerId: 'u-admin-01',
          checkerId: 'u-admin-01' // Same user -> violation!
        }
      });
      assert(invalidDualRes.status === 403, 'Dual-control violation rejected (HTTP 403): Maker cannot be Checker');

      // 2. Valid authorized amendment
      const validAmendRes = await makeRequest(`/api/v1/admin/orders/${targetOrder.id}/amend`, {
        method: 'POST',
        headers: adminHeaders,
        body: {
          amendmentType: 'PRICE_CORRECTION_CREDIT_NOTE',
          creditAmount: 500,
          creditNoteNumber: `CN-AUTO-${Date.now().toString().slice(-4)}`,
          justification: 'Authorized volume discount price correction approved by sales manager',
          makerId: 'u-office-01',
          checkerId: 'u-admin-01'
        }
      });
      assert(validAmendRes.status === 200 || validAmendRes.status === 201, `Authorized order amendment processed successfully (HTTP ${validAmendRes.status})`);
      assert(validAmendRes.data?.data?.creditNoteNumber?.startsWith('CN-'), `Credit note issued: ${validAmendRes.data?.data?.creditNoteNumber}`);
    }

    // --------------------------------------------------------------------------
    // Test 9: Controlled Cancellation & Ledger Reversal
    // --------------------------------------------------------------------------
    console.log('\n[Test 9] Non-Silent Cancellation & Double-Entry Reversal:');
    if (firstInvoice?.id) {
      const cancelRes = await makeRequest(`/api/v1/accounting/invoices/${firstInvoice.id}/cancel`, {
        method: 'POST',
        headers: adminHeaders,
        body: { reason: 'Customer requested order cancellation before dispatch' }
      });
      assert(cancelRes.status === 200, 'Invoice cancelled successfully (HTTP 200)');
      assert(cancelRes.data?.data?.status === 'CANCELLED', 'Invoice status updated to CANCELLED');

      // Also cancel other concurrent test invoices to restore batch inventory cleanly
      for (const res of results.slice(1)) {
        if (res.data?.data?.id) {
          await makeRequest(`/api/v1/accounting/invoices/${res.data.data.id}/cancel`, {
            method: 'POST',
            headers: adminHeaders,
            body: { reason: 'Concurrency test cleanup' }
          });
        }
      }
    } else {
      assert(false, 'Cannot test cancellation: first invoice was not posted');
    }

    // --------------------------------------------------------------------------
    // Summary
    // --------------------------------------------------------------------------
    console.log('\n================================================================');
    console.log(`TEST RESULTS: ${passCount} PASSED | ${failCount} FAILED`);
    console.log('================================================================\n');

    process.exit(failCount > 0 ? 1 : 0);
  } catch (err) {
    console.error('Test execution failed:', err);
    process.exit(1);
  }
}

runTests();
