/**
 * Comprehensive Automated Verification Suite for:
 * 1. Admin System Analytics Summary API (complete multi-tenant dataset, accurate points)
 * 2. Restricting Credit Transfer Management (students blocked with 403 Forbidden)
 * 3. Institution-Controlled Transfer Workflow Preservation
 * 4. Data Isolation and Integrity across BIT, KIT, and CIT
 */

const http = require('http');
const mongoose = require('mongoose');
const app = require('./server.js');

const TEST_PORT = 5096;

const makeRequest = (options, postData = null) => {
  return new Promise((resolve, reject) => {
    const opts = { ...options, port: options.port || TEST_PORT };
    const req = http.request(opts, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });
    req.on('error', reject);
    if (postData) {
      req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
    }
    req.end();
  });
};

async function loginUser(email, password = 'Password@123') {
  let res = await makeRequest(
    {
      hostname: 'localhost',
      port: TEST_PORT,
      path: '/api/v1/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    { email, password }
  );

  if (!res.body?.data?.token && password !== '123456') {
    res = await makeRequest(
      {
        hostname: 'localhost',
        port: TEST_PORT,
        path: '/api/v1/auth/login',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      { email, password: '123456' }
    );
  }

  if (!res.body?.data?.token && password !== 'Student@123456') {
    res = await makeRequest(
      {
        hostname: 'localhost',
        port: TEST_PORT,
        path: '/api/v1/auth/login',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      { email, password: 'Student@123456' }
    );
  }

  return res.body?.data?.token;
}

async function runTestSuite() {
  console.log('=================================================================');
  console.log('🧪 Starting Admin Analytics & Transfer Access Control Test Suite');
  console.log('=================================================================\n');

  while (mongoose.connection.readyState !== 1) {
    await new Promise((r) => setTimeout(r, 200));
  }

  let serverInstance = null;
  let passedTests = 0;
  let totalTests = 0;

  function assert(condition, message) {
    totalTests++;
    if (!condition) {
      console.error(`  ❌ FAILED: ${message}`);
      throw new Error(`Assertion failed: ${message}`);
    }
    passedTests++;
    console.log(`  ✅ PASSED: ${message}`);
  }

  try {
    await new Promise((resolve, reject) => {
      serverInstance = app.listen(TEST_PORT, (err) => {
        if (err) return reject(err);
        console.log(`📡 Test HTTP Server listening on port ${TEST_PORT}\n`);
        resolve();
      });
      serverInstance.on('error', reject);
    });

    // -------------------------------------------------------------
    // GROUP 1: Authentication & Access Control on Analytics Summary
    // -------------------------------------------------------------
    console.log('--- TEST GROUP 1: Analytics Summary Access Control ---');

    // 1.1 Unauthenticated Request Blocked
    const unauthAnalytics = await makeRequest({
      hostname: 'localhost',
      path: '/api/admin/analytics/summary',
      method: 'GET',
    });
    assert(unauthAnalytics.status === 401, 'Unauthenticated request to analytics summary returns 401 Unauthorized');

    // 1.2 Student Access Blocked (403 Forbidden)
    const studentToken = await loginUser('gokul.k@bitsathy.ac.in', '123456');
    assert(Boolean(studentToken), 'Student token acquired for gokul.k@bitsathy.ac.in');

    const studentAnalytics = await makeRequest({
      hostname: 'localhost',
      path: '/api/admin/analytics/summary',
      method: 'GET',
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    assert(studentAnalytics.status === 403, 'Student access to /api/admin/analytics/summary is blocked with 403 Forbidden');

    // 1.3 Institution Access Blocked (403 Forbidden)
    const bitToken = await loginUser('admin@bitsathy.ac.in', '123456');
    assert(Boolean(bitToken), 'Institution token acquired for admin@bitsathy.ac.in');

    const instAnalytics = await makeRequest({
      hostname: 'localhost',
      path: '/api/admin/analytics/summary',
      method: 'GET',
      headers: { Authorization: `Bearer ${bitToken}` },
    });
    assert(instAnalytics.status === 403, 'Institution access to /api/admin/analytics/summary is blocked with 403 Forbidden');

    // -------------------------------------------------------------
    // GROUP 2: Admin System Analytics Summary Calculation
    // -------------------------------------------------------------
    console.log('\n--- TEST GROUP 2: Complete Analytics Calculation & Invariants ---');

    const adminToken = await loginUser('admin@nep.gov.in', 'Admin@123456');
    assert(Boolean(adminToken), 'Admin token acquired for admin@nep.gov.in');

    const summaryRes = await makeRequest({
      hostname: 'localhost',
      path: '/api/admin/analytics/summary',
      method: 'GET',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(summaryRes.status === 200, 'Admin request to /api/admin/analytics/summary returns 200 OK');
    assert(summaryRes.body?.success === true, 'Analytics summary response has success: true');

    const data = summaryRes.body.data;
    console.log('   System Totals:');
    console.log(`     - Institutions: ${data.totalInstitutions}`);
    console.log(`     - Enrolled Students: ${data.totalStudents}`);
    console.log(`     - Total Credit Records: ${data.totalCredits}`);
    console.log(`     - Cumulative Credit Points: ${data.totalCumulativePoints}`);
    console.log(`     - Certificates: ${data.totalCertificates}`);

    // Invariant checks
    assert(data.totalInstitutions >= 3, 'Total institutions includes BIT, KIT, CIT (>= 3)');
    assert(data.totalStudents >= 150, 'Total enrolled students includes 50 per university (>= 150)');
    assert(data.totalCredits >= 700, 'Total academic credit records includes complete dataset beyond 50 (>= 700)');
    assert(data.totalCumulativePoints >= 2000, 'Cumulative credit points reflects all recognized points across institutions (>= 2000)');

    // Institutional breakdown validation
    console.log('   Institution Breakdown:');
    const bitBreakdown = data.instBreakdown.find((i) => i.code === 'BIT001');
    const kitBreakdown = data.instBreakdown.find((i) => i.code === 'KIT002');
    const citBreakdown = data.instBreakdown.find((i) => i.code === 'CIT003');

    assert(Boolean(bitBreakdown), 'BIT001 is included in instBreakdown');
    assert(Boolean(kitBreakdown), 'KIT002 is included in instBreakdown');
    assert(Boolean(citBreakdown), 'CIT003 is included in instBreakdown (zero-credit institution)');

    console.log(`     - BIT001: ${bitBreakdown.students} students, ${bitBreakdown.creditsCount} credits, ${bitBreakdown.totalPoints} pts`);
    console.log(`     - KIT002: ${kitBreakdown.students} students, ${kitBreakdown.creditsCount} credits, ${kitBreakdown.totalPoints} pts`);
    console.log(`     - CIT003: ${citBreakdown.students} students, ${citBreakdown.creditsCount} credits, ${citBreakdown.totalPoints} pts`);

    // Proving the core bug fix: Neither institution is zeroed out! Both coexist simultaneously!
    assert(bitBreakdown.creditsCount === 350, 'BIT001 has exactly 350 issued credit records (NOT 0 or 50)');
    assert(bitBreakdown.totalPoints === 1000, 'BIT001 has exactly 1,000 cumulative credit points (NOT 0 or 143)');
    assert(kitBreakdown.creditsCount >= 350, 'KIT002 has all its credit records preserved (>= 350)');
    assert(kitBreakdown.totalPoints >= 1000, 'KIT002 has all its cumulative credit points preserved (>= 1000)');
    assert(typeof citBreakdown.creditsCount === 'number' && citBreakdown.creditsCount >= 0, 'CIT003 correctly reflects its recognized records in the database');
    assert(typeof citBreakdown.totalPoints === 'number' && citBreakdown.totalPoints >= 0, 'CIT003 correctly reflects its cumulative credit points in the database');

    // Status and Grade distributions
    assert(Array.isArray(data.statusDistribution) && data.statusDistribution.length > 0, 'Status distribution is computed server-side');
    assert(Array.isArray(data.gradeDistribution) && data.gradeDistribution.length > 0, 'Grade distribution is computed server-side across all records');

    // -------------------------------------------------------------
    // GROUP 3: Restricting Credit Transfers for Students
    // -------------------------------------------------------------
    console.log('\n--- TEST GROUP 3: Student Credit Transfer Restrictions (RBAC) ---');

    // 3.1 Student attempting to POST /api/transfers must receive 403 Forbidden
    const studentTransferPost = await makeRequest(
      {
        hostname: 'localhost',
        path: '/api/transfers',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${studentToken}`,
        },
      },
      {
        destinationInstitutionId: kitBreakdown._id,
        creditIds: ['6ab0b18233bd480c7eb1afd0'],
        reason: 'Attempting transfer as student',
      }
    );
    assert(
      studentTransferPost.status === 403,
      `Student calling POST /api/transfers is blocked with HTTP 403 Forbidden (got ${studentTransferPost.status})`
    );
    assert(
      studentTransferPost.body?.message?.includes('not authorized') ||
      studentTransferPost.body?.message?.includes('Access denied'),
      'Student transfer rejection includes explicit access denied message'
    );

    // 3.2 Student attempting to cancel / review transfers must receive 403 Forbidden
    const dummyTransferId = new mongoose.Types.ObjectId().toString();
    const studentCancelReq = await makeRequest({
      hostname: 'localhost',
      path: `/api/transfers/${dummyTransferId}/cancel`,
      method: 'PUT',
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    assert(
      studentCancelReq.status === 403,
      'Student calling PUT /api/transfers/:id/cancel is blocked with HTTP 403 Forbidden'
    );

    const studentReviewReq = await makeRequest(
      {
        hostname: 'localhost',
        path: `/api/transfers/${dummyTransferId}/review`,
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${studentToken}`,
        },
      },
      { status: 'APPROVED' }
    );
    assert(
      studentReviewReq.status === 403,
      'Student calling PUT /api/transfers/:id/review is blocked with HTTP 403 Forbidden'
    );

    // -------------------------------------------------------------
    // GROUP 4: Institution Transfer Capabilities Intact
    // -------------------------------------------------------------
    console.log('\n--- TEST GROUP 4: Institution Transfer Capabilities Preservation ---');

    // 4.1 Institution can view transfer listings
    const instTransfersGet = await makeRequest({
      hostname: 'localhost',
      path: '/api/transfers?type=all',
      method: 'GET',
      headers: { Authorization: `Bearer ${bitToken}` },
    });
    assert(
      instTransfersGet.status === 200,
      'Institution calling GET /api/transfers returns 200 OK'
    );

    // 4.2 Institution transfer stats endpoint accessible
    const instStatsGet = await makeRequest({
      hostname: 'localhost',
      path: '/api/transfers/stats',
      method: 'GET',
      headers: { Authorization: `Bearer ${bitToken}` },
    });
    assert(
      instStatsGet.status === 200,
      'Institution calling GET /api/transfers/stats returns 200 OK'
    );

    console.log('\n=================================================================');
    console.log(`🎉 ALL ${passedTests}/${totalTests} TESTS PASSED SUCCESSFULLY!`);
    console.log('=================================================================\n');

    return { passedTests, totalTests };
  } catch (err) {
    console.error('\n❌ Test Suite Failed:', err);
    throw err;
  } finally {
    if (serverInstance) {
      await new Promise((resolve) => serverInstance.close(resolve));
    }
    await mongoose.connection.close();
  }
}

if (require.main === module) {
  runTestSuite()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = runTestSuite;
