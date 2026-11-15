/**
 * REGRESSION VERIFICATION SUITE: SUPER ADMIN-ONLY TICKET CLOSURE
 * Target: PATCH /api/v1/application-requests/:id
 *
 * Verifies:
 * 1. Unauthenticated request cannot close a ticket (HTTP 401).
 * 2. Back Office Admin attempting final closure receives HTTP 403.
 * 3. Back Office Staff attempting final closure receives HTTP 403.
 * 4. Application Support Staff attempting closure receives HTTP 403.
 * 5. Super Admin attempting closure on a ticket succeeds with HTTP 200.
 * 6. Unauthorized closure attempts leave the ticket status strictly unchanged.
 * 7. Existing permitted non-closure updates (comments, assignment) continue working for Back Office (HTTP 200).
 * 8. Existing ticket resolution workflow remains functional.
 */

import http from 'http';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TEST_PORT = 3008;

function request(method, reqPath, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const dataString = body ? JSON.stringify(body) : null;
    const reqHeaders = {
      'Content-Type': 'application/json',
      ...(dataString ? { 'Content-Length': Buffer.byteLength(dataString) } : {}),
      ...headers
    };

    const req = http.request({
      hostname: 'localhost',
      port: TEST_PORT,
      path: reqPath,
      method,
      headers: reqHeaders
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

async function startServer() {
  return new Promise((resolve, reject) => {
    const serverProcess = spawn('node', ['dist/server.cjs'], {
      cwd: __dirname,
      env: { ...process.env, PORT: String(TEST_PORT), NODE_ENV: 'test' }
    });

    let started = false;

    serverProcess.stdout.on('data', data => {
      const output = data.toString();
      if (output.includes('listening on port') && !started) {
        started = true;
        resolve(serverProcess);
      }
    });

    serverProcess.stderr.on('data', data => {
      const err = data.toString();
      // Ignore routine startup warnings
      if (!started && err.includes('EADDRINUSE')) {
        reject(new Error(`Port ${TEST_PORT} already in use.`));
      }
    });

    serverProcess.on('exit', code => {
      if (!started) reject(new Error(`Server exited prematurely with code ${code}`));
    });

    setTimeout(() => {
      if (!started) {
        serverProcess.kill();
        reject(new Error('Server start timed out after 15s'));
      }
    }, 15000);
  });
}

async function runSuite() {
  console.log('================================================================');
  console.log('APPLICATION SUPPORT TICKET CLOSURE AUTHORIZATION REGRESSION SUITE');
  console.log('================================================================\n');

  let serverProcess;
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
    console.log(`[Setup] Starting test server on port ${TEST_PORT}...`);
    serverProcess = await startServer();
    console.log(`[Setup] Test server successfully started on port ${TEST_PORT}.\n`);

    // Authenticate test actors
    console.log('[Setup] Authenticating test personas via /api/v1/auth/login:');

    // Super Admin
    const adminLogin = await request('POST', '/api/v1/auth/login', {
      email: 'admin@a2zdiagnostic.com',
      password: 'A2zSecurePass#2026'
    });
    assert(adminLogin.status === 200 && adminLogin.body.accessToken, 'Super Admin login succeeded');
    const adminToken = adminLogin.body.accessToken;

    // Back Office Admin
    const officeAdminLogin = await request('POST', '/api/v1/auth/login', {
      email: 'office.admin@a2zdiagnostic.com',
      password: 'A2zSecurePass#2026'
    });
    assert(officeAdminLogin.status === 200 && officeAdminLogin.body.accessToken, 'Back Office Admin login succeeded');
    const officeAdminToken = officeAdminLogin.body.accessToken;

    // Back Office Staff
    const officeStaffLogin = await request('POST', '/api/v1/auth/login', {
      email: 'dispatch.staff@a2zdiagnostic.com',
      password: 'A2zSecurePass#2026'
    });
    assert(officeStaffLogin.status === 200 && officeStaffLogin.body.accessToken, 'Back Office Staff login succeeded');
    const officeStaffToken = officeStaffLogin.body.accessToken;

    // Application Support Staff
    const appStaffLogin = await request('POST', '/api/v1/auth/login', {
      email: 'app.support@a2zdiagnostic.com',
      password: 'A2zSecurePass#2026'
    });
    assert(appStaffLogin.status === 200 && appStaffLogin.body.accessToken, 'Application Support Staff login succeeded');
    const appStaffToken = appStaffLogin.body.accessToken;

    // Use test fixture app-req-101
    const targetTicketId = 'app-req-101';

    // Verify initial state
    const initialGet = await request('GET', `/api/v1/application-requests/${targetTicketId}`, null, {
      'Authorization': `Bearer ${adminToken}`
    });
    const initialStatus = initialGet.body.data.status;
    console.log(`\n[Initial State] Target ticket ${targetTicketId} initial status: "${initialStatus}"`);

    // ------------------------------------------------------------------------
    // TEST 1: Unauthenticated request cannot close a ticket: HTTP 401
    // ------------------------------------------------------------------------
    console.log('\n[Test 1] Unauthenticated Request Protection:');
    const unauthClose = await request('PATCH', `/api/v1/application-requests/${targetTicketId}`, {
      status: 'CLOSED'
    });
    assert(unauthClose.status === 401, 'Unauthenticated PATCH /application-requests/:id rejected with HTTP 401 Unauthorized');
    assert(unauthClose.body.error === 'Unauthorized', 'Error payload explicitly indicates Unauthorized');

    // ------------------------------------------------------------------------
    // TEST 2: Back Office Admin attempting CLOSED: HTTP 403
    // ------------------------------------------------------------------------
    console.log('\n[Test 2] Back Office Admin Closure Restriction:');
    const boAdminClose = await request('PATCH', `/api/v1/application-requests/${targetTicketId}`, {
      status: 'CLOSED'
    }, {
      'Authorization': `Bearer ${officeAdminToken}`
    });
    assert(boAdminClose.status === 403, 'Back Office Admin attempt to close ticket rejected with HTTP 403 Forbidden');
    assert(
      boAdminClose.body.message && boAdminClose.body.message.includes('Final ticket closure requires Super Admin authorization'),
      'Rejection message explicitly explains Super Admin closure requirement',
      boAdminClose.body.message
    );

    // ------------------------------------------------------------------------
    // TEST 3: Back Office Staff attempting CLOSED: HTTP 403
    // ------------------------------------------------------------------------
    console.log('\n[Test 3] Back Office Staff Closure Restriction:');
    const boStaffClose = await request('PATCH', `/api/v1/application-requests/${targetTicketId}`, {
      status: 'CLOSED'
    }, {
      'Authorization': `Bearer ${officeStaffToken}`
    });
    assert(boStaffClose.status === 403, 'Back Office Staff attempt to close ticket rejected with HTTP 403 Forbidden');
    assert(
      boStaffClose.body.message && boStaffClose.body.message.includes('Final ticket closure requires Super Admin authorization'),
      'Rejection message explicitly explains Super Admin closure requirement',
      boStaffClose.body.message
    );

    // ------------------------------------------------------------------------
    // TEST 4: Application Support Staff attempting CLOSED: HTTP 403
    // ------------------------------------------------------------------------
    console.log('\n[Test 4] Application Support Staff Closure Restriction:');
    const appStaffClose = await request('PATCH', `/api/v1/application-requests/${targetTicketId}`, {
      status: 'CLOSED'
    }, {
      'Authorization': `Bearer ${appStaffToken}`
    });
    assert(appStaffClose.status === 403, 'Application Support Staff attempt to close ticket rejected with HTTP 403 Forbidden');

    // ------------------------------------------------------------------------
    // TEST 6: Unauthorized attempts do not change the ticket status
    // ------------------------------------------------------------------------
    console.log('\n[Test 6] Integrity Verification (Ticket Unchanged after Unauthorized Attempts):');
    const verifyUnchanged = await request('GET', `/api/v1/application-requests/${targetTicketId}`, null, {
      'Authorization': `Bearer ${adminToken}`
    });
    assert(
      verifyUnchanged.body.data.status === initialStatus,
      `Ticket status remains strictly intact: "${verifyUnchanged.body.data.status}" === "${initialStatus}"`
    );
    assert(
      !verifyUnchanged.body.data.closureApprovedByAdmin,
      'Closure approval flag is not set after rejected attempts'
    );

    // ------------------------------------------------------------------------
    // TEST 7: Existing permitted non-closure updates continue working for Back Office
    // ------------------------------------------------------------------------
    console.log('\n[Test 7] Permitted Non-Closure Updates by Back Office (Comments & Staff Assignment):');
    const boPermittedUpdate = await request('PATCH', `/api/v1/application-requests/${targetTicketId}`, {
      assignedStaffName: 'Ananya Deshmukh (Lead Specialist)',
      commentText: 'Back Office reviewed methodology. Approved for on-site protocol.'
    }, {
      'Authorization': `Bearer ${officeAdminToken}`
    });
    assert(boPermittedUpdate.status === 200, 'Back Office Admin permitted update succeeded with HTTP 200 OK');
    assert(
      boPermittedUpdate.body.data.assignedStaffName === 'Ananya Deshmukh (Lead Specialist)',
      'Assigned specialist name successfully updated by Back Office'
    );
    assert(
      boPermittedUpdate.body.data.comments.some(c => c.text.includes('Back Office reviewed methodology')),
      'Comment successfully appended to ticket history by Back Office'
    );
    assert(
      boPermittedUpdate.body.data.status === initialStatus,
      'Ticket status remains non-closed after comment update'
    );

    // ------------------------------------------------------------------------
    // TEST 7b: COMPLETED is a distinct non-closure status permitted for Back Office
    // ------------------------------------------------------------------------
    console.log('\n[Test 7b] Distinct Workflow Status: COMPLETED is permitted for Back Office:');
    const boCompletedUpdate = await request('PATCH', `/api/v1/application-requests/app-req-102`, {
      status: 'COMPLETED',
      commentText: 'Operational training protocol completed by laboratory.'
    }, {
      'Authorization': `Bearer ${officeAdminToken}`
    });
    assert(boCompletedUpdate.status === 200, 'Back Office Admin setting status to COMPLETED succeeds with HTTP 200 OK');
    assert(boCompletedUpdate.body.data.status === 'COMPLETED', 'Ticket status successfully updated to COMPLETED by Back Office');
    assert(!boCompletedUpdate.body.data.closureApprovedByAdmin, 'COMPLETED status does not stamp closureApprovedByAdmin flag (not a final closure)');

    // ------------------------------------------------------------------------
    // TEST 8: Existing ticket resolution workflow remains functional
    // ------------------------------------------------------------------------
    console.log('\n[Test 8] Application Support Ticket Resolution Workflow:');
    const resolveRes = await request('POST', `/api/v1/app-support/tickets/ast-001/resolve`, {
      resolutionNotes: 'Protocol correlation verified against calibrators.',
      calibratorSlope: 0.998,
      qcValues: { level1: 101.2, level2: 242.0 }
    }, {
      'Authorization': `Bearer ${appStaffToken}`
    });
    assert(resolveRes.status === 200, 'Application Support Staff ticket resolution succeeded with HTTP 200 OK');
    assert(resolveRes.body.data.status === 'RESOLVED', 'Ticket status updated to RESOLVED');
    assert(resolveRes.body.data.overtimePay === 0, 'Zero overtime policy maintained during resolution');

    // ------------------------------------------------------------------------
    // TEST 5: Super Admin attempting CLOSED: successful response (HTTP 200)
    // ------------------------------------------------------------------------
    console.log('\n[Test 5] Super Admin Final Ticket Closure Authorization:');
    const adminClose = await request('PATCH', `/api/v1/application-requests/${targetTicketId}`, {
      status: 'CLOSED',
      commentText: 'Final protocol sign-off authorized by Super Admin.'
    }, {
      'Authorization': `Bearer ${adminToken}`
    });
    assert(adminClose.status === 200, 'Super Admin final ticket closure succeeded with HTTP 200 OK');
    assert(adminClose.body.data.status === 'CLOSED', 'Ticket status successfully updated to CLOSED');
    assert(adminClose.body.data.closureApprovedByAdmin === true, 'closureApprovedByAdmin flag is stamped true');
    assert(adminClose.body.data.closureApprovedByName.length > 0, 'Super Admin approver identity is recorded in audit metadata');

  } catch (err) {
    console.error('Unexpected test failure:', err);
    failed++;
  } finally {
    if (serverProcess) {
      console.log('\n[Cleanup] Terminating test server...');
      serverProcess.kill('SIGTERM');
      // Wait for clean exit
      await new Promise(r => setTimeout(r, 1000));
      console.log('[Cleanup] Test server stopped.');
    }
  }

  console.log('\n================================================================');
  console.log(`REGRESSION RESULTS: ${passed} PASSED | ${failed} FAILED (TOTAL: ${passed + failed})`);
  console.log('================================================================\n');

  if (failed > 0) process.exit(1);
}

runSuite().catch(err => {
  console.error('Suite execution error:', err);
  process.exit(1);
});
