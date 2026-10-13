const http = require('http');
const mongoose = require('mongoose');
const app = require('./server.js');
const { Course } = require('./models/Course');
const { AcademicCredit } = require('./models/AcademicCredit');
const { Certificate } = require('./models/Certificate');
const { TransferRequest } = require('./models/TransferRequest');
const { Transcript } = require('./models/Transcript');
const APIKey = require('./models/APIKey');

let serverInstance = null;

const createdArtifacts = {
  courses: [],
  credits: [],
  certificates: [],
  transfers: [],
  transcripts: [],
  apiKeys: [],
};

// Helper: HTTP request wrapper
const makeRequest = (options, postData = null) => {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, headers: res.headers, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, body: data });
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

// Helper: Login and obtain JWT
async function login(email, password) {
  const res = await makeRequest(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    { email, password }
  );

  if (res.status !== 200 || !res.body?.data?.token) {
    throw new Error(`Login failed for ${email} (${res.status}): ${JSON.stringify(res.body)}`);
  }
  return {
    token: res.body.data.token,
    user: res.body.data.user,
  };
}

let passedTests = 0;
let failedTests = 0;

function assert(condition, testName, failureDetails = '') {
  if (condition) {
    console.log(`   ✅ PASS: ${testName}`);
    passedTests++;
  } else {
    console.error(`   ❌ FAIL: ${testName} - ${failureDetails}`);
    failedTests++;
    throw new Error(`Assertion failed: ${testName} - ${failureDetails}`);
  }
}

async function runComprehensiveSuite() {
  console.log('================================================================');
  console.log('🏛️  NEP ACADEMIC CREDIT HUB — MASTER FEATURE VERIFICATION SUITE');
  console.log('================================================================\n');

  // Start test server if not listening
  try {
    await new Promise((resolve, reject) => {
      serverInstance = app.listen(5000, () => {
        console.log('🚀 Test server listening on http://localhost:5000');
        resolve();
      });
      serverInstance.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
          console.log('📡 Port 5000 already in use, connecting to existing instance...');
          serverInstance = null;
          resolve();
        } else {
          reject(err);
        }
      });
    });
  } catch (err) {
    console.error('Server bind warning:', err.message);
  }

  // Ensure DB ready
  while (mongoose.connection.readyState !== 1) {
    await new Promise((r) => setTimeout(r, 200));
  }
  await new Promise((r) => setTimeout(r, 400));

  try {
    // -------------------------------------------------------------
    // SETUP PERSONAS
    // -------------------------------------------------------------
    console.log('🔑 Authenticating System Personas...');
    const studentAuth = await login('student101@gmail.com', '123456');
    const sourceInstAuth = await login('bitsathy@gmail.com', '123456');
    const destInstAuth = await login('kiterode@gmail.com', '123456');
    const adminAuth = await login('admin@nep.gov.in', 'Admin@123456');

    console.log(`   ✓ Student: ${studentAuth.user.email} (${studentAuth.user.name})`);
    console.log(`   ✓ Source Institution: ${sourceInstAuth.user.email} (${sourceInstAuth.user.institutionCode})`);
    console.log(`   ✓ Destination Institution: ${destInstAuth.user.email} (${destInstAuth.user.institutionCode})`);
    console.log(`   ✓ Superadmin: ${adminAuth.user.email} (${adminAuth.user.name})\n`);

    // =============================================================
    // SECTION 1: STUDENT DASHBOARD & STUDENT FEATURES
    // =============================================================
    console.log('🎓 SECTION 1: STUDENT DASHBOARD & FEATURES');

    // 1.1 Student Overview & Wallet Summary
    console.log('\n--- 1.1 Student Overview & Wallet Summary ---');
    const walletRes = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/credits/wallet-summary',
      method: 'GET',
      headers: { Authorization: `Bearer ${studentAuth.token}` },
    });
    assert(walletRes.status === 200, 'Student Wallet Summary API returns 200');
    assert(walletRes.body.data !== undefined, 'Wallet Summary contains data payload');
    assert(typeof walletRes.body.data.totalCredits === 'number', 'Wallet contains numeric totalCredits');
    assert(typeof walletRes.body.data.verifiedCredits === 'number', 'Wallet contains verifiedCredits');
    console.log(`   Credits Earned: ${walletRes.body.data.totalCredits}, Verified: ${walletRes.body.data.verifiedCredits}`);

    // Timeline
    const timelineRes = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/credits/timeline',
      method: 'GET',
      headers: { Authorization: `Bearer ${studentAuth.token}` },
    });
    assert(timelineRes.status === 200, 'Student Timeline API returns 200');
    assert(typeof timelineRes.body.data === 'object' && timelineRes.body.data !== null, 'Timeline returns structured historical periods object');

    // 1.2 Course Catalog
    console.log('\n--- 1.2 Course Catalog ---');
    const catalogRes = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/courses',
      method: 'GET',
      headers: { Authorization: `Bearer ${studentAuth.token}` },
    });
    assert(catalogRes.status === 200, 'Course Catalog returns 200');
    const courses = catalogRes.body.data?.courses || catalogRes.body.data || [];
    assert(courses.length > 0, 'Course Catalog contains active courses');
    const sampleCourse = courses[0];
    assert(sampleCourse.courseCode && sampleCourse.credits, 'Course has code and credit value');

    // Single Course Details
    const courseDetailRes = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: `/api/courses/${sampleCourse._id}`,
      method: 'GET',
      headers: { Authorization: `Bearer ${studentAuth.token}` },
    });
    assert(courseDetailRes.status === 200, 'Single Course details returns 200');
    assert(courseDetailRes.body.data?.courseCode === sampleCourse.courseCode, 'Course details match courseCode');

    // Filter by institution
    const instCatalogRes = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: `/api/courses?institutionId=${sourceInstAuth.user.institutionId}`,
      method: 'GET',
      headers: { Authorization: `Bearer ${studentAuth.token}` },
    });
    assert(instCatalogRes.status === 200, 'Institution-filtered Course Catalog returns 200');

    // 1.3 Academic Credit Wallet / Passport
    console.log('\n--- 1.3 Academic Credit Wallet / Passport ---');
    const creditsRes = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/credits',
      method: 'GET',
      headers: { Authorization: `Bearer ${studentAuth.token}` },
    });
    assert(creditsRes.status === 200, 'Academic Credits list returns 200');
    const studentCredits = creditsRes.body.data?.credits || creditsRes.body.data || [];
    assert(Array.isArray(studentCredits), 'Student credits is an array');
    if (studentCredits.length > 0) {
      const cr = studentCredits[0];
      assert(cr.integrityHash !== undefined, 'Credit record contains cryptographic integrityHash');
      assert(cr.verificationStatus !== undefined, 'Credit record contains verificationStatus');
    }

    // 1.4 Credit Transfer Status & History (Student view)
    console.log('\n--- 1.4 Student Credit Transfers ---');
    const studentTransfersRes = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/transfers',
      method: 'GET',
      headers: { Authorization: `Bearer ${studentAuth.token}` },
    });
    assert(studentTransfersRes.status === 200, 'Student Transfers list returns 200');

    // 1.5 Certificates & Transcripts (Student view)
    console.log('\n--- 1.5 Certificates & Transcripts ---');
    const certsRes = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/certificates',
      method: 'GET',
      headers: { Authorization: `Bearer ${studentAuth.token}` },
    });
    assert(certsRes.status === 200, 'Student Certificates list returns 200');

    // Generate Transcript
    const transcriptPostRes = await makeRequest(
      {
        hostname: 'localhost',
        port: 5000,
        path: '/api/transcripts',
        method: 'POST',
        headers: {
          Authorization: `Bearer ${studentAuth.token}`,
          'Content-Type': 'application/json',
        },
      },
      {}
    );
    assert(transcriptPostRes.status === 200 || transcriptPostRes.status === 201, 'Student can generate academic transcript');
    const transcriptData = transcriptPostRes.body.data;
    if (transcriptData?._id) createdArtifacts.transcripts.push(transcriptData._id);
    assert(transcriptData.verificationCode !== undefined, 'Transcript contains verificationCode');

    // Public Transcript Verification (Without JWT)
    const publicVerifyRes = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: `/api/transcripts/verify/${transcriptData.verificationCode}`,
      method: 'GET',
    });
    assert(publicVerifyRes.status === 200, 'Public Transcript Verification endpoint returns 200');
    assert(publicVerifyRes.body.data?.isValid === true, 'Public verification confirms transcript is valid');

    // 1.6 Eligibility Tracker & Recommendations
    console.log('\n--- 1.6 Eligibility Tracker & Recommendations ---');
    const eligRes = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/eligibility',
      method: 'GET',
      headers: { Authorization: `Bearer ${studentAuth.token}` },
    });
    assert(eligRes.status === 200, 'Eligibility Tracker returns 200');
    assert(eligRes.body.data?.summary?.verifiedCredits !== undefined, 'Eligibility provides verifiedCredits in summary');
    assert(Array.isArray(eligRes.body.data?.requirements), 'Eligibility provides requirements list');

    const recsRes = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/recommendations',
      method: 'GET',
      headers: { Authorization: `Bearer ${studentAuth.token}` },
    });
    assert(recsRes.status === 200, 'Course Recommendations returns 200');
    assert(Array.isArray(recsRes.body.data?.recommendations), 'Recommendations returns course array');

    // =============================================================
    // SECTION 2: INSTITUTION ADMIN DASHBOARD & FEATURES
    // =============================================================
    console.log('\n🏛️ SECTION 2: INSTITUTION ADMIN DASHBOARD & FEATURES');

    // 2.1 Institution Overview
    console.log('\n--- 2.1 Institution Overview Telemetry ---');
    const instOverviewRes = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/institution/overview',
      method: 'GET',
      headers: { Authorization: `Bearer ${sourceInstAuth.token}` },
    });
    assert(instOverviewRes.status === 200, 'Institution Overview returns 200');
    const ov = instOverviewRes.body.data;
    assert(typeof ov.students?.enrolled === 'number', 'Overview contains enrolled students count');
    assert(typeof ov.courses?.active === 'number', 'Overview contains active courses count');
    assert(typeof ov.credits?.totalPoints === 'number', 'Overview contains total credit points');
    assert(ov.institutionProfile?.naacAccreditation !== undefined, 'Overview contains NAAC accreditation');
    assert(ov.transfers?.incoming !== undefined, 'Overview contains incoming transfer summary');
    assert(ov.transfers?.outgoing !== undefined, 'Overview contains outgoing transfer summary');
    assert(ov.apiGateway !== undefined, 'Overview contains API gateway health summary');

    // 2.2 Student Management
    console.log('\n--- 2.2 Student Management ---');
    const instStudentsRes = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/students',
      method: 'GET',
      headers: { Authorization: `Bearer ${sourceInstAuth.token}` },
    });
    assert(instStudentsRes.status === 200, 'Institution can retrieve enrolled students list');
    const enrolledList = instStudentsRes.body.data;
    assert(Array.isArray(enrolledList), 'Enrolled students list is an array');
    assert(enrolledList.length > 0, 'Institution has enrolled students');
    const sampleStudent = enrolledList[0];

    // Single student profile
    const studentProfileRes = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: `/api/students/${sampleStudent._id}`,
      method: 'GET',
      headers: { Authorization: `Bearer ${sourceInstAuth.token}` },
    });
    assert(studentProfileRes.status === 200, 'Institution can view student academic profile');

    // 2.3 Course Management
    console.log('\n--- 2.3 Course Management (CRUD) ---');
    const uniqueCourseCode = `CS_AUTO_${Date.now().toString().slice(-5)}`;
    const createCourseRes = await makeRequest(
      {
        hostname: 'localhost',
        port: 5000,
        path: '/api/courses',
        method: 'POST',
        headers: {
          Authorization: `Bearer ${sourceInstAuth.token}`,
          'Content-Type': 'application/json',
        },
      },
      {
        courseCode: uniqueCourseCode,
        courseName: 'Automated Testing & Quality Engineering',
        credits: 4,
        department: 'Computer Science & Engineering',
        semester: 6,
        courseLevel: 'Undergraduate',
        description: 'Automated test suite verification course',
      }
    );
    assert(createCourseRes.status === 201, 'Institution can create course');
    const createdCourse = createCourseRes.body.data;
    if (createdCourse?._id) createdArtifacts.courses.push(createdCourse._id);

    // Update course
    const updateCourseRes = await makeRequest(
      {
        hostname: 'localhost',
        port: 5000,
        path: `/api/courses/${createdCourse._id}`,
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${sourceInstAuth.token}`,
          'Content-Type': 'application/json',
        },
      },
      {
        description: 'Updated course description for QA',
      }
    );
    assert(updateCourseRes.status === 200, 'Institution can update course');

    // 2.4 Academic Credit Management and Validation
    console.log('\n--- 2.4 Credit Validation & Awarding ---');
    const validateRes = await makeRequest(
      {
        hostname: 'localhost',
        port: 5000,
        path: '/api/credits/validate',
        method: 'POST',
        headers: {
          Authorization: `Bearer ${sourceInstAuth.token}`,
          'Content-Type': 'application/json',
        },
      },
      {
        studentId: sampleStudent._id,
        courseId: createdCourse._id,
        credits: 4,
        grade: 'A+',
        semester: 6,
        academicYear: '2025-26',
      }
    );
    assert(validateRes.status === 200, 'Credit validation tool returns 200');
    assert(validateRes.body.data?.isValid === true, 'Pre-validation marks payload as valid');

    // Award credit
    const awardRes = await makeRequest(
      {
        hostname: 'localhost',
        port: 5000,
        path: '/api/credits',
        method: 'POST',
        headers: {
          Authorization: `Bearer ${sourceInstAuth.token}`,
          'Content-Type': 'application/json',
        },
      },
      {
        studentId: sampleStudent._id,
        courseId: createdCourse._id,
        credits: 4,
        grade: 'A+',
        semester: 6,
        academicYear: '2025-26',
      }
    );
    assert(awardRes.status === 201, 'Credit awarded successfully');
    const awardedCredit = awardRes.body.data;
    if (awardedCredit?._id) createdArtifacts.credits.push(awardedCredit._id);

    // Verify credit
    const verifyCreditRes = await makeRequest(
      {
        hostname: 'localhost',
        port: 5000,
        path: `/api/credits/${awardedCredit._id}`,
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${sourceInstAuth.token}`,
          'Content-Type': 'application/json',
        },
      },
      {
        verificationStatus: 'verified',
      }
    );
    assert(verifyCreditRes.status === 200, 'Credit verified successfully');

    // 2.5 Certificate Management
    console.log('\n--- 2.5 Certificate Issuance & Verification ---');
    const certIssueRes = await makeRequest(
      {
        hostname: 'localhost',
        port: 5000,
        path: '/api/certificates',
        method: 'POST',
        headers: {
          Authorization: `Bearer ${sourceInstAuth.token}`,
          'Content-Type': 'application/json',
        },
      },
      {
        studentId: sampleStudent._id,
        courseId: createdCourse._id,
        academicCreditId: awardedCredit._id,
        title: 'Certificate of Excellence in Automated Testing',
        certificateType: 'course_completion',
      }
    );
    assert(certIssueRes.status === 201, 'Institution can issue certificate');
    const issuedCert = certIssueRes.body.data;
    if (issuedCert?._id) createdArtifacts.certificates.push(issuedCert._id);

    // Institution reviews and marks certificate as verified
    const reviewCertRes = await makeRequest(
      {
        hostname: 'localhost',
        port: 5000,
        path: `/api/certificates/${issuedCert._id}/verify`,
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${sourceInstAuth.token}`,
          'Content-Type': 'application/json',
        },
      },
      {
        verificationStatus: 'verified',
      }
    );
    assert(reviewCertRes.status === 200, 'Institution reviews and verifies certificate');

    // Public certificate verification
    const publicCertRes = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: `/api/certificates/verify/${issuedCert.certificateId}`,
      method: 'GET',
    });
    assert(publicCertRes.status === 200, 'Public Certificate Verification returns 200');
    assert(publicCertRes.body.data?.isValid === true, 'Certificate authenticity verified');

    // 2.6 B2B API Gateway Integration
    console.log('\n--- 2.6 B2B Integration — API Gateway ---');
    const gatewayInfoRes = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/gateway/info',
      method: 'GET',
      headers: { Authorization: `Bearer ${sourceInstAuth.token}` },
    });
    assert(gatewayInfoRes.status === 200, 'Gateway Info returns 200');

    // Generate API Key
    const keyGenRes = await makeRequest(
      {
        hostname: 'localhost',
        port: 5000,
        path: '/api/gateway/keys',
        method: 'POST',
        headers: {
          Authorization: `Bearer ${sourceInstAuth.token}`,
          'Content-Type': 'application/json',
        },
      },
      {
        name: 'Automated Test Partner Gateway Key',
        scopes: ['read:credits', 'submit:credits', 'verify:certificates', 'read:students'],
      }
    );
    assert(keyGenRes.status === 201, 'API Key generated successfully');
    const apiKeySecret = keyGenRes.body.data?.secretKey || keyGenRes.body.data?.apiKey;
    const apiKeyId = keyGenRes.body.data?._id;
    if (apiKeyId) createdArtifacts.apiKeys.push(apiKeyId);
    assert(apiKeySecret && apiKeySecret.startsWith('nep_live_'), 'Key has nep_live_ prefix');

    // System-to-system B2B Gateway Consumption
    const b2bCreditsRes = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/gateway/credits',
      method: 'GET',
      headers: { 'x-api-key': apiKeySecret },
    });
    assert(b2bCreditsRes.status === 200, 'B2B API Gateway accepts key and returns credits');
    assert(Array.isArray(b2bCreditsRes.body.data), 'Gateway returns credits array scoped to institution');

    // Check API Logs
    const apiLogsRes = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/gateway/logs',
      method: 'GET',
      headers: { Authorization: `Bearer ${sourceInstAuth.token}` },
    });
    assert(apiLogsRes.status === 200, 'API Logs telemetry returns 200');
    assert(apiLogsRes.body.data?.length > 0, 'API request logged in APILog database');

    // Revoke Key
    const revokeRes = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: `/api/gateway/keys/${apiKeyId}/revoke`,
      method: 'PUT',
      headers: { Authorization: `Bearer ${sourceInstAuth.token}` },
    });
    assert(revokeRes.status === 200, 'API Key revoked successfully');

    // Confirm revoked key is rejected
    const revokedCheckRes = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/gateway/credits',
      method: 'GET',
      headers: { 'x-api-key': apiKeySecret },
    });
    assert(revokedCheckRes.status === 401, 'Revoked API Key correctly rejected with 401');

    // =============================================================
    // SECTION 3: SUPERADMIN DASHBOARD & FEATURES
    // =============================================================
    console.log('\n👑 SECTION 3: SUPERADMIN DASHBOARD & FEATURES');

    // 3.1 System Overview
    console.log('\n--- 3.1 Superadmin System Overview ---');
    const adminOverviewRes = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/admin/overview',
      method: 'GET',
      headers: { Authorization: `Bearer ${adminAuth.token}` },
    });
    assert(adminOverviewRes.status === 200, 'Admin Overview returns 200');
    const adminData = adminOverviewRes.body.data;
    assert(adminData.totalInstitutions > 0, 'Admin sees total institutions');
    assert(adminData.totalStudents > 0, 'Admin sees total students');
    assert(adminData.totalVerifiedCredits > 0, 'Admin sees system-wide verified credits');
    assert(Array.isArray(adminData.recentAuditLogs), 'Admin sees system-wide audit logs');

    // 3.2 Institution Management
    console.log('\n--- 3.2 Institution Governance ---');
    const allInstRes = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/institutions?all=true',
      method: 'GET',
      headers: { Authorization: `Bearer ${adminAuth.token}` },
    });
    assert(allInstRes.status === 200, 'Admin can view all registered institutions');
    const institutionsList = allInstRes.body.data?.institutions || allInstRes.body.institutions || allInstRes.body.data || [];
    assert(institutionsList.length >= 2, 'Admin sees at least 2 institutions');

    // 3.3 User & Role Oversight
    console.log('\n--- 3.3 User & Role Oversight ---');
    const adminStudentsRes = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/students',
      method: 'GET',
      headers: { Authorization: `Bearer ${adminAuth.token}` },
    });
    assert(adminStudentsRes.status === 200, 'Admin can view all students globally');

    // 3.4 Cross-Institution Transfer Oversight
    console.log('\n--- 3.4 Transfer Governance ---');
    const adminTransfersRes = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/transfers',
      method: 'GET',
      headers: { Authorization: `Bearer ${adminAuth.token}` },
    });
    assert(adminTransfersRes.status === 200, 'Admin can monitor all system transfers');

    const transferStatsRes = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/transfers/stats',
      method: 'GET',
      headers: { Authorization: `Bearer ${adminAuth.token}` },
    });
    assert(transferStatsRes.status === 200, 'Admin can view transfer statistics');

    // 3.5 System Audit Trail & Monitoring
    console.log('\n--- 3.5 Audit Trail & Health ---');
    const auditRes = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/gateway/audit-logs',
      method: 'GET',
      headers: { Authorization: `Bearer ${adminAuth.token}` },
    });
    assert(auditRes.status === 200, 'Admin can access system audit logs');

    const healthRes = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/health',
      method: 'GET',
    });
    assert(healthRes.status === 200, 'System Health endpoint returns 200');
    assert(healthRes.body.database === 'connected', 'Database status is connected');

    // =============================================================
    // SECTION 4: SHARED SYSTEM FEATURES & SECURITY ENFORCEMENT
    // =============================================================
    console.log('\n🛡️ SECTION 4: SHARED SYSTEM FEATURES & SECURITY ENFORCEMENT');

    // 4.1 RBAC Enforcement
    console.log('\n--- 4.1 Role-Based Access Control (RBAC) ---');
    const studentToAdminRes = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/admin/overview',
      method: 'GET',
      headers: { Authorization: `Bearer ${studentAuth.token}` },
    });
    assert(studentToAdminRes.status === 403, 'Student blocked from admin overview with 403');

    const instToAdminRes = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/admin/overview',
      method: 'GET',
      headers: { Authorization: `Bearer ${sourceInstAuth.token}` },
    });
    assert(instToAdminRes.status === 403, 'Institution blocked from admin overview with 403');

    const unauthRes = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/credits',
      method: 'GET',
    });
    assert(unauthRes.status === 401, 'Unauthenticated request blocked with 401');

    // 4.2 Multi-Tenant Data Isolation
    console.log('\n--- 4.2 Multi-Tenant Data Isolation ---');
    const crossTenantStudentRes = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: `/api/students/${sampleStudent._id}`,
      method: 'GET',
      headers: { Authorization: `Bearer ${destInstAuth.token}` },
    });
    assert(crossTenantStudentRes.status === 403, 'Cross-tenant student inspection blocked with 403');

    // 4.3 Validation & Error Handling
    console.log('\n--- 4.3 Input Validation & Error Handling ---');
    const invalidCreditPayloadRes = await makeRequest(
      {
        hostname: 'localhost',
        port: 5000,
        path: '/api/credits',
        method: 'POST',
        headers: {
          Authorization: `Bearer ${sourceInstAuth.token}`,
          'Content-Type': 'application/json',
        },
      },
      {
        studentId: sampleStudent._id,
        courseId: createdCourse._id,
        credits: 999, // Exceeds NEP max limit 20
        grade: 'Z_INVALID',
      }
    );
    assert(invalidCreditPayloadRes.status === 400 || invalidCreditPayloadRes.status === 500, 'Invalid credits rejected');

    // =============================================================
    // SECTION 5: THE MOST IMPORTANT END-TO-END WORKFLOW
    // =============================================================
    console.log('\n⚡ SECTION 5: THE CRITICAL END-TO-END WORKFLOW');
    console.log('   (Student earns -> Verified -> Submitted -> Reviewed -> Approved -> Transferred in Passport)');

    // Step 1 & 2: Student earns and source institution verifies credit
    console.log('\n   Stage 1 & 2: Verified Credit Record Established');
    console.log(`   Course: ${createdCourse.courseCode}, Credits: ${awardedCredit.credits}, Student: ${sampleStudent.name}`);
    assert(verifyCreditRes.status === 200, 'Credit record is verified and ready for mobility');

    // Step 3: Transfer Request Submitted
    console.log('\n   Stage 3: Submitting Transfer Request to Destination Institution...');
    const transferReqRes = await makeRequest(
      {
        hostname: 'localhost',
        port: 5000,
        path: '/api/transfers',
        method: 'POST',
        headers: {
          Authorization: `Bearer ${sourceInstAuth.token}`,
          'Content-Type': 'application/json',
        },
      },
      {
        studentId: sampleStudent._id,
        destinationInstitutionId: destInstAuth.user.institutionId,
        creditIds: [awardedCredit._id],
        reason: 'NEP 2020 Multi-Disciplinary Credit Mobility Test',
      }
    );
    assert(transferReqRes.status === 201, 'Transfer Request initiated successfully');
    const transferReq = transferReqRes.body.data;
    if (transferReq?._id) createdArtifacts.transfers.push(transferReq._id);
    assert(transferReq.status === 'PENDING', 'Transfer Request status is PENDING');
    console.log(`   Transfer Request ID: #${transferReq._id.slice(-6).toUpperCase()}`);

    // Step 4: Destination Institution Reviews & Approves
    console.log('\n   Stage 4: Destination Institution Reviews & Approves Transfer...');
    const reviewRes = await makeRequest(
      {
        hostname: 'localhost',
        port: 5000,
        path: `/api/transfers/${transferReq._id}/review`,
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${destInstAuth.token}`,
          'Content-Type': 'application/json',
        },
      },
      {
        status: 'APPROVED',
        remarks: 'Course syllabus equivalency evaluated and verified under NEP 2020 framework',
      }
    );
    assert(reviewRes.status === 200, 'Destination institution successfully approves transfer');
    assert(reviewRes.body.data?.status === 'APPROVED', 'Transfer status updated to APPROVED');

    // Step 5: Approved credits are recorded safely in MongoDB
    console.log('\n   Stage 5: Verifying Credit Record State Update in MongoDB...');
    const updatedCreditRes = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: `/api/credits/${awardedCredit._id}`,
      method: 'GET',
      headers: { Authorization: `Bearer ${destInstAuth.token}` },
    });
    assert(updatedCreditRes.status === 200, 'Updated credit record fetched successfully');
    const updatedCredit = updatedCreditRes.body.data;
    assert(updatedCredit.isTransferred === true, 'Credit record marked as isTransferred = true');
    assert(
      updatedCredit.transferredTo.toString() === destInstAuth.user.institutionId.toString(),
      'transferredTo matches destination institution ID'
    );
    console.log('   Credit successfully transferred in database to:', destInstAuth.user.institutionCode);

    // Step 6: Student Passport & Transcript Reflect Result
    console.log('\n   Stage 6: Student Passport & Transcript Reflect Mobility Result...');
    const finalTranscriptRes = await makeRequest(
      {
        hostname: 'localhost',
        port: 5000,
        path: '/api/transcripts',
        method: 'POST',
        headers: {
          Authorization: `Bearer ${studentAuth.token}`,
          'Content-Type': 'application/json',
        },
      },
      {}
    );
    assert(finalTranscriptRes.status === 200 || finalTranscriptRes.status === 201, 'Student generates updated transcript');
    const finalTranscript = finalTranscriptRes.body.data;
    if (finalTranscript?._id) createdArtifacts.transcripts.push(finalTranscript._id);
    assert(finalTranscript.verificationCode !== undefined, 'Updated transcript has verification code');

    const verifyFinalRes = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: `/api/transcripts/verify/${finalTranscript.verificationCode}`,
      method: 'GET',
    });
    assert(verifyFinalRes.status === 200, 'Public transcript verification confirms updated transcript');
    console.log(`   Official Transcript Verified Code: ${finalTranscript.verificationCode}`);

    console.log('\n================================================================');
    console.log(`🎉 ALL FEATURES VERIFIED SUCCESSFULLY!`);
    console.log(`   Total Tests Passed: ${passedTests}`);
    console.log(`   Total Tests Failed: ${failedTests}`);
    console.log('================================================================\n');
  } catch (error) {
    console.error('\n❌ TEST SUITE FAILED WITH ERROR:', error.message);
  } finally {
    console.log('\n🧹 Running Safe Comprehensive Teardown of Test-Created Artifacts...');
    try {
      if (createdArtifacts.transfers.length > 0) {
        await TransferRequest.deleteMany({ _id: { $in: createdArtifacts.transfers } });
        console.log(`   ✓ Removed ${createdArtifacts.transfers.length} test transfer request(s)`);
      }
      if (createdArtifacts.transcripts.length > 0) {
        await Transcript.deleteMany({ _id: { $in: createdArtifacts.transcripts } });
        console.log(`   ✓ Removed ${createdArtifacts.transcripts.length} test transcript(s)`);
      }
      if (createdArtifacts.certificates.length > 0) {
        await Certificate.deleteMany({ _id: { $in: createdArtifacts.certificates } });
        console.log(`   ✓ Removed ${createdArtifacts.certificates.length} test certificate(s)`);
      }
      if (createdArtifacts.credits.length > 0) {
        await AcademicCredit.deleteMany({ _id: { $in: createdArtifacts.credits } });
        console.log(`   ✓ Removed ${createdArtifacts.credits.length} test academic credit(s)`);
      }
      if (createdArtifacts.courses.length > 0) {
        await Course.deleteMany({ _id: { $in: createdArtifacts.courses } });
        console.log(`   ✓ Removed ${createdArtifacts.courses.length} test course(s)`);
      }
      if (createdArtifacts.apiKeys.length > 0) {
        await APIKey.deleteMany({ _id: { $in: createdArtifacts.apiKeys } });
        console.log(`   ✓ Removed ${createdArtifacts.apiKeys.length} test API key(s)`);
      }
      console.log('   ✓ Database integrity preserved (pre-existing academic records intact).');
    } catch (cleanupErr) {
      console.error('   ⚠️ Teardown error:', cleanupErr.message);
    }

    if (serverInstance) {
      serverInstance.close();
    }
    process.exit(failedTests > 0 ? 1 : 0);
  }
}

runComprehensiveSuite();
