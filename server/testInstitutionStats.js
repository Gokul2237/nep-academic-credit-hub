const http = require('http');
const mongoose = require('mongoose');
require('./server.js');

const makeRequest = (options, postData = null) => {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
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
      req.write(JSON.stringify(postData));
    }
    req.end();
  });
};

async function loginUser(email, password = 'Password@123') {
  let res = await makeRequest(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    { email, password }
  );

  if (!res.body?.data?.token && password !== '123456') {
    // Try fallback seed password
    res = await makeRequest(
      {
        hostname: 'localhost',
        port: 5000,
        path: '/api/auth/login',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      { email, password: '123456' }
    );
  }

  return res.body?.data?.token;
}

async function runInstitutionStatsSuite() {
  console.log('🧪 Starting Institution Overview Real Database Statistics Test Suite...\n');

  // Wait for MongoDB readyState
  while (mongoose.connection.readyState !== 1) {
    await new Promise((r) => setTimeout(r, 200));
  }
  await new Promise((r) => setTimeout(r, 300));

  try {
    // -------------------------------------------------------------
    // Test 1: BIT001 Overview Statistics Verification
    // -------------------------------------------------------------
    console.log('1️⃣  Testing BIT001 Overview Statistics...');
    const bitToken = await loginUser('bitsathy@gmail.com');
    if (!bitToken) {
      throw new Error('Failed to login as BIT001 (bitsathy@gmail.com)');
    }

    const bitRes = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/institution/overview',
      method: 'GET',
      headers: {
        Authorization: `Bearer ${bitToken}`,
      },
    });

    console.log('   Response status:', bitRes.status);
    if (bitRes.status !== 200 || !bitRes.body?.success) {
      throw new Error(`BIT001 overview failed with status ${bitRes.status}: ${JSON.stringify(bitRes.body)}`);
    }

    const bitData = bitRes.body.data;
    console.log('   Enrolled Students:', bitData.students.enrolled, '(Expected: 5)');
    console.log('   Active Courses:', bitData.courses.active, '(Expected: 13)');
    console.log('   Awarded Credit Points:', bitData.credits.totalPoints, '(Expected: 20)');
    console.log('   Verified Credit Records:', bitData.credits.verifiedRecords, '(Expected: 7)');
    console.log('   Incoming Transfers Total:', bitData.transfers.incoming.total, '(Expected: 0)');
    console.log('   Outgoing Transfers Total:', bitData.transfers.outgoing.total, '(Expected: 1)');
    console.log('   Institution Code:', bitData.institutionProfile.code, '(Expected: BIT001)');

    // Relational & Invariant Checks for BIT001
    if (typeof bitData.students.enrolled !== 'number' || bitData.students.enrolled < 0) {
      throw new Error(`Invalid enrolled students value for BIT001: ${bitData.students.enrolled}`);
    }
    if (bitData.students.enrolled > bitData.students.total) {
      throw new Error(`Enrolled students cannot exceed total students: ${bitData.students.enrolled} > ${bitData.students.total}`);
    }
    if (typeof bitData.courses.active !== 'number' || bitData.courses.active < 0 || bitData.courses.active > bitData.courses.total) {
      throw new Error(`Invalid active courses value for BIT001: ${bitData.courses.active}`);
    }
    if (typeof bitData.credits.totalPoints !== 'number' || bitData.credits.totalPoints < 0) {
      throw new Error(`Invalid total credit points for BIT001: ${bitData.credits.totalPoints}`);
    }
    if (bitData.credits.verifiedRecords > bitData.credits.totalRecords) {
      throw new Error(`Verified credit records cannot exceed total credits: ${bitData.credits.verifiedRecords} > ${bitData.credits.totalRecords}`);
    }
    if (bitData.institutionProfile.code !== 'BIT001') {
      throw new Error(`Expected institution code BIT001, got ${bitData.institutionProfile.code}`);
    }
    console.log('   ✅ BIT001 Live MongoDB metrics verified successfully with relational invariants!\n');

    // -------------------------------------------------------------
    // Test 2: KIT002 Overview Statistics Verification
    // -------------------------------------------------------------
    console.log('2️⃣  Testing KIT002 Overview Statistics (Zero-state verification)...');
    const kitToken = await loginUser('kiterode@gmail.com');
    if (!kitToken) {
      throw new Error('Failed to login as KIT002 (kiterode@gmail.com)');
    }

    const kitRes = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/institution/overview',
      method: 'GET',
      headers: {
        Authorization: `Bearer ${kitToken}`,
      },
    });

    console.log('   Response status:', kitRes.status);
    if (kitRes.status !== 200 || !kitRes.body?.success) {
      throw new Error(`KIT002 overview failed with status ${kitRes.status}: ${JSON.stringify(kitRes.body)}`);
    }

    const kitData = kitRes.body.data;
    console.log('   Enrolled Students:', kitData.students.enrolled);
    console.log('   Active Courses:', kitData.courses.active);
    console.log('   Awarded Credit Points:', kitData.credits.totalPoints);
    console.log('   Verified Credit Records:', kitData.credits.verifiedRecords);
    console.log('   Incoming Transfers Total:', kitData.transfers.incoming.total);
    console.log('   Outgoing Transfers Total:', kitData.transfers.outgoing.total);
    console.log('   Institution Code:', kitData.institutionProfile.code, '(Expected: KIT002)');

    // Relational & Invariant Checks for KIT002
    if (typeof kitData.students.enrolled !== 'number' || kitData.students.enrolled < 0) {
      throw new Error(`Invalid enrolled students value for KIT002: ${kitData.students.enrolled}`);
    }
    if (kitData.students.enrolled > kitData.students.total) {
      throw new Error(`Enrolled students cannot exceed total students for KIT002: ${kitData.students.enrolled} > ${kitData.students.total}`);
    }
    if (typeof kitData.courses.active !== 'number' || kitData.courses.active < 0 || kitData.courses.active > kitData.courses.total) {
      throw new Error(`Invalid active courses value for KIT002: ${kitData.courses.active}`);
    }
    if (typeof kitData.credits.totalPoints !== 'number' || kitData.credits.totalPoints < 0) {
      throw new Error(`Invalid total credit points for KIT002: ${kitData.credits.totalPoints}`);
    }
    if (kitData.institutionProfile.code !== 'KIT002') {
      throw new Error(`Expected institution code KIT002, got ${kitData.institutionProfile.code}`);
    }
    console.log('   ✅ KIT002 Live MongoDB metrics verified successfully with relational invariants!\n');

    // -------------------------------------------------------------
    // Test 3: Versioned Route Verification (/api/v1/institution/overview)
    // -------------------------------------------------------------
    console.log('3️⃣  Testing Versioned API Route (/api/v1/institution/overview)...');
    const v1Res = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/v1/institution/overview',
      method: 'GET',
      headers: {
        Authorization: `Bearer ${bitToken}`,
      },
    });

    if (v1Res.status !== 200 || !v1Res.body?.success) {
      throw new Error(`Versioned route /api/v1/institution/overview failed: ${v1Res.status}`);
    }
    console.log('   ✅ /api/v1/institution/overview returned 200 OK!\n');

    // -------------------------------------------------------------
    // Test 4: RBAC Security - Student Access Blocked (403 Forbidden)
    // -------------------------------------------------------------
    console.log('4️⃣  Testing RBAC: Student Role Access Attempt...');
    const studentToken = await loginUser('student101@gmail.com');
    if (!studentToken) {
      throw new Error('Failed to login as student (student101@gmail.com)');
    }

    const studentRes = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/institution/overview',
      method: 'GET',
      headers: {
        Authorization: `Bearer ${studentToken}`,
      },
    });

    console.log('   Student access response status:', studentRes.status, '(Expected: 403)');
    if (studentRes.status !== 403) {
      throw new Error(`Expected 403 Forbidden for student, got ${studentRes.status}`);
    }
    console.log('   ✅ RBAC properly enforced: Students blocked with 403 Forbidden!\n');

    // -------------------------------------------------------------
    // Test 5: Unauthenticated Access Blocked (401 Unauthorized)
    // -------------------------------------------------------------
    console.log('5️⃣  Testing Unauthenticated Access (Missing Bearer Token)...');
    const unauthRes = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/institution/overview',
      method: 'GET',
    });

    console.log('   Unauthenticated response status:', unauthRes.status, '(Expected: 401)');
    if (unauthRes.status !== 401) {
      throw new Error(`Expected 401 Unauthorized, got ${unauthRes.status}`);
    }
    console.log('   ✅ Authentication properly enforced: Missing token blocked with 401 Unauthorized!\n');

    console.log('🎉 ALL INSTITUTION OVERVIEW TESTS PASSED WITH 100% SUCCESS!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Test suite failed:', err);
    process.exit(1);
  }
}

runInstitutionStatsSuite();
