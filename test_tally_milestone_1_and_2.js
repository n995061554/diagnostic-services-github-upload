/**
 * Comprehensive Automated Verification Suite for Tally ERP 9
 * Milestones 1 & 2: Foundation & Masters
 */

import http from 'http';

const BASE_URL = 'http://127.0.0.1:3000';

function request(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const bodyStr = body ? JSON.stringify(body) : '';
    const options = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: {
        'Content-Type': 'application/json',
        ...(body ? { 'Content-Length': Buffer.byteLength(bodyStr) } : {}),
        ...headers,
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const parsed = data ? JSON.parse(data) : {};
          resolve({ status: res.statusCode, headers: res.headers, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, body: data });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(bodyStr);
    req.end();
  });
}

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  [PASS] ${message}`);
    passed++;
  } else {
    console.error(`  [FAIL] ${message}`);
    failed++;
  }
}

async function runSuite() {
  console.log('================================================================');
  console.log('RUNNING TALLY ERP 9 SUITE VERIFICATION: MILESTONES 1 & 2');
  console.log('================================================================\n');

  try {
    // -------------------------------------------------------------
    // Test 1: Demo Credentials & Auth Context
    // -------------------------------------------------------------
    console.log('[Test 1] Auth & Demo Credentials Endpoint:');
    const authRes = await request('GET', '/api/v1/tally/auth/demo-credentials');
    assert(authRes.status === 200, 'GET /auth/demo-credentials returned HTTP 200');
    assert(authRes.body.roles && authRes.body.roles.length === 3, 'Returns 3 Tally roles (Owner, Accountant, Viewer)');
    console.log('');

    // -------------------------------------------------------------
    // Test 2: Initial Company Listing & Active Company Selection
    // -------------------------------------------------------------
    console.log('[Test 2] Company Listing & Selected Company:');
    const compRes = await request('GET', '/api/v1/tally/companies');
    assert(compRes.status === 200, 'GET /companies returned HTTP 200');
    assert(compRes.body.companies && compRes.body.companies.length >= 1, 'At least 1 company exists');
    const activeCompany = compRes.body.companies[0];
    assert(activeCompany.name === 'A2Z Diagnostic Services Pvt Ltd', `Default company matches "${activeCompany.name}"`);
    assert(activeCompany.features.enableInventory === true, 'Inventory feature enabled by default');
    assert(activeCompany.features.enableGst === true, 'GST feature enabled by default');
    console.log('');

    const companyId = activeCompany.id;

    // -------------------------------------------------------------
    // Test 3: Standard 28 Tally Groups Preloaded
    // -------------------------------------------------------------
    console.log('[Test 3] Preloaded Standard 28 Tally Account Groups:');
    const grpRes = await request('GET', `/api/v1/tally/companies/${companyId}/groups`);
    assert(grpRes.status === 200, 'GET /groups returned HTTP 200');
    const groups = grpRes.body.groups;
    assert(groups.length >= 28, `Found ${groups.length} groups (>= 28 standard groups)`);

    const hasCapital = groups.some((g) => g.name === 'Capital Account' && g.nature === 'Liability');
    const hasCurrentAssets = groups.some((g) => g.name === 'Current Assets' && g.nature === 'Asset');
    const hasDebtors = groups.some((g) => g.name === 'Sundry Debtors' && g.nature === 'Asset');
    const hasCreditors = groups.some((g) => g.name === 'Sundry Creditors' && g.nature === 'Liability');
    const hasSales = groups.some((g) => g.name === 'Sales Accounts' && g.affectsGrossProfit === true);
    const hasPurchases = groups.some((g) => g.name === 'Purchase Accounts' && g.affectsGrossProfit === true);

    assert(hasCapital, 'Capital Account group present with Liability nature');
    assert(hasCurrentAssets, 'Current Assets group present with Asset nature');
    assert(hasDebtors, 'Sundry Debtors group present');
    assert(hasCreditors, 'Sundry Creditors group present');
    assert(hasSales, 'Sales Accounts group present and affects Gross Profit');
    assert(hasPurchases, 'Purchase Accounts group present and affects Gross Profit');
    console.log('');

    // -------------------------------------------------------------
    // Test 4: Default System Ledgers & Chart of Accounts
    // -------------------------------------------------------------
    console.log('[Test 4] Default System Ledgers & Chart of Accounts:');
    const ledRes = await request('GET', `/api/v1/tally/companies/${companyId}/ledgers`);
    assert(ledRes.status === 200, 'GET /ledgers returned HTTP 200');
    const ledgers = ledRes.body.ledgers;
    const hasCash = ledgers.some((l) => l.name === 'Cash' && l.isDefault === true);
    const hasPnl = ledgers.some((l) => l.name === 'Profit & Loss A/c' && l.isDefault === true);
    assert(hasCash, 'Default system ledger "Cash" is seeded');
    assert(hasPnl, 'Default system ledger "Profit & Loss A/c" is seeded');
    console.log('');

    // -------------------------------------------------------------
    // Test 5: Standard Voucher Types
    // -------------------------------------------------------------
    console.log('[Test 5] Default Voucher Types:');
    const vtRes = await request('GET', `/api/v1/tally/companies/${companyId}/voucher-types`);
    assert(vtRes.status === 200, 'GET /voucher-types returned HTTP 200');
    const vts = vtRes.body.voucherTypes;
    assert(vts.length >= 10, `Found ${vts.length} default voucher types (>= 10)`);
    assert(vts.some((vt) => vt.name === 'Sales' && vt.baseType === 'Sales'), 'Sales voucher type present');
    assert(vts.some((vt) => vt.name === 'Purchase' && vt.baseType === 'Purchase'), 'Purchase voucher type present');
    assert(vts.some((vt) => vt.name === 'Payment' && vt.baseType === 'Payment'), 'Payment voucher type present');
    assert(vts.some((vt) => vt.name === 'Receipt' && vt.baseType === 'Receipt'), 'Receipt voucher type present');
    assert(vts.some((vt) => vt.name === 'Contra' && vt.baseType === 'Contra'), 'Contra voucher type present');
    assert(vts.some((vt) => vt.name === 'Journal' && vt.baseType === 'Journal'), 'Journal voucher type present');
    console.log('');

    // -------------------------------------------------------------
    // Test 6: Inventory Masters: Units, Godowns, Stock Groups, Stock Items
    // -------------------------------------------------------------
    console.log('[Test 6] Inventory Masters (Units, Godowns, Stock Items):');
    const [untRes, gdnRes, sgRes, siRes] = await Promise.all([
      request('GET', `/api/v1/tally/companies/${companyId}/units`),
      request('GET', `/api/v1/tally/companies/${companyId}/godowns`),
      request('GET', `/api/v1/tally/companies/${companyId}/stock-groups`),
      request('GET', `/api/v1/tally/companies/${companyId}/stock-items`),
    ]);

    assert(untRes.status === 200 && untRes.body.units.length >= 4, 'Standard Units (NOS, BOX, KIT, PCS) loaded');
    assert(gdnRes.status === 200 && gdnRes.body.godowns.length >= 1, 'Default "Main Location" godown loaded');
    assert(sgRes.status === 200 && sgRes.body.stockGroups.length >= 1, 'Stock Groups loaded');
    assert(siRes.status === 200 && siRes.body.stockItems.length >= 1, 'Stock Items loaded with GST and valuation');
    const firstItem = siRes.body.stockItems[0];
    assert(firstItem.valuationMethod === 'FIFO', `First stock item uses FIFO valuation (${firstItem.name})`);
    assert(firstItem.gstRate === 12, 'Accu-Chek Glucose Strips has 12% GST');
    console.log('');

    // -------------------------------------------------------------
    // Test 7: Create Custom Company & Verify 28 Groups Auto-Seeded
    // -------------------------------------------------------------
    console.log('[Test 7] Create New Company & Verify Auto-Seeding:');
    const newCompPayload = {
      name: `Test Diagnostics ${Date.now()}`,
      mailingName: 'Test Diagnostics Labs LLP',
      state: 'Karnataka',
      stateCode: '29',
      pincode: '560001',
      gstin: '29AABCT1234F1Z1',
      financialYearStart: '2026-04-01',
      features: { enableInventory: true, enableGst: true, enableBillByBill: true },
    };
    const createCompRes = await request('POST', '/api/v1/tally/companies', newCompPayload);
    assert(createCompRes.status === 201, 'POST /companies returned HTTP 201 Created');
    const createdComp = createCompRes.body.company;
    assert(createdComp.name === newCompPayload.name, 'Company name persisted');

    // Verify groups auto-seeded
    const newCompGroups = await request('GET', `/api/v1/tally/companies/${createdComp.id}/groups`);
    assert(newCompGroups.body.groups.length >= 28, 'New company automatically received full 28 Tally groups');

    // Verify default ledgers auto-seeded
    const newCompLedgers = await request('GET', `/api/v1/tally/companies/${createdComp.id}/ledgers`);
    assert(newCompLedgers.body.ledgers.some((l) => l.name === 'Cash'), 'New company automatically received Cash ledger');
    console.log('');

    // -------------------------------------------------------------
    // Test 8: Custom Ledger CRUD & Guards
    // -------------------------------------------------------------
    console.log('[Test 8] Custom Ledger CRUD & System Ledger Protection:');
    const debtorsGrp = groups.find((g) => g.name === 'Sundry Debtors');
    const createLedgerPayload = {
      name: `Apex Pathology Clinic ${Date.now()}`,
      alias: 'Apex Path',
      groupId: debtorsGrp.id,
      openingBalancePaise: 2500000, // ₹25,000.00
      openingBalanceType: 'Dr',
      billByBillEnabled: true,
      gstin: '27AABCA5555Q1Z8',
      state: 'Maharashtra',
      stateCode: '27',
      address: 'Shop 4, Sunrise Plaza, Pune',
      contactPerson: 'Dr. Anita Roy',
      phone: '+91 98900 11223',
    };

    const createLedRes = await request('POST', `/api/v1/tally/companies/${companyId}/ledgers`, createLedgerPayload);
    assert(createLedRes.status === 201, 'POST /ledgers returned HTTP 201 Created');
    const createdLedger = createLedRes.body.ledger;
    assert(createdLedger.openingBalancePaise === 2500000, 'Opening balance stored in exact paise: 2500000');
    assert(createdLedger.billByBillEnabled === true, 'Bill-by-bill tracking enabled');

    // Update Ledger
    const updateLedRes = await request('PUT', `/api/v1/tally/companies/${companyId}/ledgers/${createdLedger.id}`, {
      alias: 'Apex Pathology Main',
    });
    assert(updateLedRes.status === 200, 'PUT /ledgers/:id returned HTTP 200');
    assert(updateLedRes.body.ledger.alias === 'Apex Pathology Main', 'Ledger alias updated successfully');

    // Try deleting system Cash ledger -> must be rejected!
    const cashLedger = ledgers.find((l) => l.name === 'Cash');
    const deleteCashRes = await request('DELETE', `/api/v1/tally/companies/${companyId}/ledgers/${cashLedger.id}`);
    assert(deleteCashRes.status === 400, 'DELETE on system "Cash" ledger rejected with HTTP 400 Bad Request');

    // Delete custom ledger -> must succeed
    const deleteCustomRes = await request('DELETE', `/api/v1/tally/companies/${companyId}/ledgers/${createdLedger.id}`);
    assert(deleteCustomRes.status === 200, 'DELETE on custom ledger succeeded with HTTP 200');
    console.log('');

    // -------------------------------------------------------------
    // Test 9: Custom Stock Item CRUD
    // -------------------------------------------------------------
    console.log('[Test 9] Custom Stock Item CRUD:');
    const kitUnit = untRes.body.units.find((u) => u.symbol === 'KIT');
    const createItemPayload = {
      name: `Cobas Reagent Pack ${Date.now()}`,
      partNumber: 'RCH-COBAS-200T',
      stockGroupId: sgRes.body.stockGroups[0].id,
      unitId: kitUnit.id,
      hsnSac: '38220090',
      gstRate: 12,
      valuationMethod: 'FIFO',
      openingQty: 50,
      openingRatePaise: 420000, // ₹4,200.00
      standardSellingPricePaise: 550000, // ₹5,500.00
    };

    const createItemRes = await request('POST', `/api/v1/tally/companies/${companyId}/stock-items`, createItemPayload);
    assert(createItemRes.status === 201, 'POST /stock-items returned HTTP 201 Created');
    const createdItem = createItemRes.body.stockItem;
    assert(createdItem.openingValuePaise === 50 * 420000, `Opening value calculated correctly: ₹${createdItem.openingValuePaise / 100}`);

    // Delete custom stock item
    const deleteItemRes = await request('DELETE', `/api/v1/tally/companies/${companyId}/stock-items/${createdItem.id}`);
    assert(deleteItemRes.status === 200, 'DELETE /stock-items/:id returned HTTP 200');
    console.log('');

    // -------------------------------------------------------------
    // Test 10: Company Deletion Guard (Exact Name Confirmation)
    // -------------------------------------------------------------
    console.log('[Test 10] Company Deletion with Name Confirmation:');
    // Wrong confirmation name -> must fail
    const wrongDelRes = await request('DELETE', `/api/v1/tally/companies/${createdComp.id}`, {
      confirmationName: 'Wrong Name',
    });
    assert(wrongDelRes.status === 400, 'DELETE with wrong confirmation name rejected with HTTP 400');

    // Exact confirmation name -> must succeed
    const correctDelRes = await request('DELETE', `/api/v1/tally/companies/${createdComp.id}`, {
      confirmationName: createdComp.name,
    });
    assert(correctDelRes.status === 200, 'DELETE with exact company name confirmation succeeded with HTTP 200');
    console.log('');
  } catch (err) {
    console.error('Unexpected test suite error:', err);
    failed++;
  }

  console.log('================================================================');
  console.log(`TEST RESULTS: ${passed} PASSED | ${failed} FAILED`);
  console.log('================================================================\n');

  if (failed > 0) process.exit(1);
}

runSuite();
