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

    if (bitData.students.enrolled !== 5) throw new Error(`Expected 5 enrolled students for BIT001, got ${bitData.students.enrolled}`);
    if (bitData.courses.active !== 13) throw new Error(`Expected 13 active courses for BIT001, got ${bitData.courses.active}`);
    if (bitData.credits.totalPoints !== 20) throw new Error(`Expected 20 credit points for BIT001, got ${bitData.credits.totalPoints}`);
    if (bitData.credits.verifiedRecords !== 7) throw new Error(`Expected 7 verified credit records for BIT001, got ${bitData.credits.verifiedRecords}`);
    if (bitData.transfers.incoming.total !== 0) throw new Error(`Expected 0 incoming transfers for BIT001, got ${bitData.transfers.incoming.total}`);
    if (bitData.transfers.outgoing.total !== 1) throw new Error(`Expected 1 outgoing transfers for BIT001, got ${bitData.transfers.outgoing.total}`);
    console.log('   ✅ BIT001 Live MongoDB metrics verified successfully!\n');

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
    console.log('   Enrolled Students:', kitData.students.enrolled, '(Expected: 5)');
    console.log('   Active Courses:', kitData.courses.active, '(Expected: 0 - Honest zero)');
    console.log('   Awarded Credit Points:', kitData.credits.totalPoints, '(Expected: 0 - Honest zero)');
    console.log('   Verified Credit Records:', kitData.credits.verifiedRecords, '(Expected: 0)');
    console.log('   Incoming Transfers Total:', kitData.transfers.incoming.total, '(Expected: 1)');
    console.log('   Outgoing Transfers Total:', kitData.transfers.outgoing.total, '(Expected: 0)');
    console.log('   Institution Code:', kitData.institutionProfile.code, '(Expected: KIT002)');

    if (kitData.students.enrolled !== 5) throw new Error(`Expected 5 enrolled students for KIT002, got ${kitData.students.enrolled}`);
    if (kitData.courses.active !== 0) throw new Error(`Expected 0 active courses for KIT002, got ${kitData.courses.active}`);
    if (kitData.credits.totalPoints !== 0) throw new Error(`Expected 0 credit points for KIT002, got ${kitData.credits.totalPoints}`);
    if (kitData.transfers.incoming.total !== 1) throw new Error(`Expected 1 incoming transfer for KIT002, got ${kitData.transfers.incoming.total}`);
    if (kitData.transfers.outgoing.total !== 0) throw new Error(`Expected 0 outgoing transfers for KIT002, got ${kitData.transfers.outgoing.total}`);
    console.log('   ✅ KIT002 Live MongoDB metrics verified successfully!\n');

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
