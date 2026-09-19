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

async function runFullSuite() {
  console.log('🧪 Starting Phase 6-12 Comprehensive Backend Verification Suite...\n');
  
  while (mongoose.connection.readyState !== 1) {
    await new Promise((r) => setTimeout(r, 300));
  }
  await new Promise((r) => setTimeout(r, 500));

  const testId = Date.now().toString().slice(-4);
  const studentEmail = `student_full_${testId}@test.ac.in`;
  const instEmail = `dean_full_${testId}@iitb.ac.in`;
  const password = 'Password@123';

  let studentToken = null;
  let studentId = null;
  let instToken = null;
  let instId = null;
  let courseId = null;
  let creditId = null;
  let apiKeySecret = null;
  let apiKeyId = null;

  try {
    // 1. Setup Personas
    console.log('1️⃣  Setting up test personas (Institution & Student)...');
    const regInst = await makeRequest(
      {
        hostname: 'localhost',
        port: 5000,
        path: '/api/auth/register',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      {
        name: 'Prof. Test Director',
        email: instEmail,
        password,
        role: 'institution',
        institutionName: 'IIT Test University',
        institutionCode: `IIT_${testId}`,
      }
    );
    console.log(`   Reg Status: ${regInst.status}`, regInst.body);
    if (regInst.status !== 201) throw new Error(`Institution registration failed: ${JSON.stringify(regInst.body)}`);
    instToken = regInst.body.data.token;
    instId = regInst.body.data.user.institutionId;

    const regStudent = await makeRequest(
      {
        hostname: 'localhost',
        port: 5000,
        path: '/api/auth/register',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      {
        name: `Student Full ${testId}`,
        email: studentEmail,
        password,
        role: 'student',
        studentId: `STU-FULL-${testId}`,
        institutionId: instId,
      }
    );
    if (regStudent.status !== 201) throw new Error('Student registration failed');
    studentToken = regStudent.body.data.token;
    studentId = regStudent.body.data.user._id;

    console.log('   ✓ Personas registered and tokens issued.');

    // 2. Course Creation
    console.log('\n2️⃣  Creating Course and Awarding Verified Credit...');
    const courseRes = await makeRequest(
      {
        hostname: 'localhost',
        port: 5000,
        path: '/api/courses',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${instToken}`,
        },
      },
      {
        courseCode: `CS-ADV-${testId}`,
        courseName: 'Advanced Data Structures & Algorithms',
        credits: 4,
        department: 'Computer Science',
        semester: 5,
      }
    );
    if (courseRes.status !== 201) throw new Error('Course creation failed');
    courseId = courseRes.body.data._id;

    const creditRes = await makeRequest(
      {
        hostname: 'localhost',
        port: 5000,
        path: '/api/credits',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${instToken}`,
        },
      },
      {
        studentId,
        courseId,
        credits: 4,
        grade: 'A+',
        semester: 5,
        academicYear: '2025-26',
        verificationStatus: 'verified',
      }
    );
    if (creditRes.status !== 201) throw new Error('Credit creation failed');
    creditId = creditRes.body.data._id;
    console.log('   ✓ Verified credit record created.');

    // 3. Phase 6: Transcript Generation
    console.log('\n3️⃣  Testing Phase 6: Transcript Generation...');
    const transcriptRes = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/transcripts',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`,
      },
    });
    console.log(`   Status: ${transcriptRes.status} (Expected 201)`);
    if (transcriptRes.status !== 201) throw new Error('Transcript generation failed');
    const vCode = transcriptRes.body.data.verificationCode;
    console.log(`   Verification Code: ${vCode}`);

    // Public transcript verification
    console.log('\n4️⃣  Testing Phase 6: Public Transcript Verification...');
    const pubTrans = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: `/api/transcripts/verify/${vCode}`,
      method: 'GET',
    });
    console.log(`   Status: ${pubTrans.status} (Expected 200)`);
    console.log(`   Verified & Valid: ${pubTrans.body.data.isValid}`);
    if (!pubTrans.body.data.isValid) throw new Error('Public transcript verification failed');

    // 4. Phase 7: Eligibility Evaluation
    console.log('\n5️⃣  Testing Phase 7: Eligibility Tracker API...');
    const eligRes = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/eligibility',
      method: 'GET',
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    console.log(`   Status: ${eligRes.status} (Expected 200)`);
    console.log(`   Verified Credits Evaluated: ${eligRes.body.data.summary.verifiedCredits}`);
    if (eligRes.status !== 200) throw new Error('Eligibility evaluation failed');

    // 5. Phase 8: Course Recommendation Engine
    console.log('\n6️⃣  Testing Phase 8: Course Recommendation Engine...');
    const recRes = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/recommendations',
      method: 'GET',
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    console.log(`   Status: ${recRes.status} (Expected 200)`);
    console.log(`   Recommendations Count: ${recRes.body.data.totalRecommended}`);
    if (recRes.status !== 200) throw new Error('Recommendation API failed');

    // 6. Phase 9: B2B API Key Generation & Gateway
    console.log('\n7️⃣  Testing Phase 9: API Key Generation...');
    const keyGen = await makeRequest(
      {
        hostname: 'localhost',
        port: 5000,
        path: '/api/gateway/keys',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${instToken}`,
        },
      },
      {
        name: 'B2B Integration Key Test',
        scopes: ['read:credits', 'submit:credits', 'verify:certificates', 'read:students'],
      }
    );
    console.log(`   Status: ${keyGen.status} (Expected 201)`);
    if (keyGen.status !== 201) throw new Error('API key generation failed');
    apiKeySecret = keyGen.body.data.secretKey;
    apiKeyId = keyGen.body.data._id;
    console.log(`   Generated Raw Secret: ${apiKeySecret.slice(0, 15)}...`);

    console.log('\n8️⃣  Testing Phase 9: B2B API Gateway Consumption (read:credits)...');
    const b2bRead = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/gateway/v1/credits',
      method: 'GET',
      headers: { 'X-API-Key': apiKeySecret },
    });
    console.log(`   Status: ${b2bRead.status} (Expected 200)`);
    console.log(`   Gateway Returned Records: ${b2bRead.body.data?.length}`);
    if (b2bRead.status !== 200) throw new Error('Gateway read credits failed');

    // 7. Phase 10: Smart Credit Pre-Validation Engine
    console.log('\n9️⃣  Testing Phase 10: Smart Credit Pre-Validation Engine...');
    const valRes = await makeRequest(
      {
        hostname: 'localhost',
        port: 5000,
        path: '/api/credits/validate',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${instToken}`,
        },
      },
      {
        studentId,
        courseId,
        institutionId: instId,
        credits: 4,
        grade: 'A',
        semester: 6,
        academicYear: '2025-26',
      }
    );
    console.log(`   Status: ${valRes.status} (Expected 200)`);
    console.log(`   Overall Status: ${valRes.body.data.overallStatus}`);
    console.log(`   Checks Passed: ${valRes.body.data.checks.filter((c) => c.passed).length}/7`);
    if (valRes.status !== 200 || !valRes.body.data.isValid) throw new Error('Smart credit validation failed');

    // 8. Phase 12: Security Hardening Checks
    console.log('\n🔟 Testing Phase 12: Security Hardening & Authorization Limits...');
    // Revoke key test
    const revKey = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: `/api/gateway/keys/${apiKeyId}/revoke`,
      method: 'PUT',
      headers: { Authorization: `Bearer ${instToken}` },
    });
    console.log(`   Revoke Key Status: ${revKey.status} (Expected 200)`);

    // Verify revoked key is denied access
    const b2bDenied = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/gateway/v1/credits',
      method: 'GET',
      headers: { 'X-API-Key': apiKeySecret },
    });
    console.log(`   Revoked Gateway Request Status: ${b2bDenied.status} (Expected 401)`);
    if (b2bDenied.status !== 401) throw new Error('Revoked key security check failed');

    console.log('\n==============================================');
    console.log(' PHASE 6 - 12 BACKEND SUITE SUMMARY');
    console.log('==============================================');
    console.log('🎉 ALL PHASE 6-12 BACKEND TESTS PASSED SUCCESSFULLY!');
    console.log('==============================================\n');
    process.exit(0);
  } catch (err) {

    console.error('\n❌ FULL SUITE TEST FAILED:', err.message);
    process.exit(1);
  }
}

runFullSuite();
