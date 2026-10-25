const http = require('http');
const mongoose = require('mongoose');
const app = require('./server.js');
const { User, ROLES } = require('./models/User');
const Institution = require('./models/Institution');
const { Course } = require('./models/Course');
const { AcademicCredit } = require('./models/AcademicCredit');
const CreditPolicy = require('./models/CreditPolicy');
const { generateCreditHash } = require('./utils/hashHelper');

let serverInstance = null;
const createdArtifacts = {
  credits: [],
  users: [],
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

async function login(email, password = '123456') {
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

async function runRoadmapTests() {
  console.log('================================================================');
  console.log('🧭 NEP ACADEMIC CREDIT HUB — STUDENT ROADMAP & READINESS SUITE');
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
    console.error('Server bind error:', err);
  }

  // Ensure DB ready
  if (mongoose.connection.readyState !== 1) {
    await new Promise((resolve) => {
      mongoose.connection.once('connected', resolve);
    });
  }

  try {
    // 1. Authenticate Personas
    console.log('🔑 Authenticating Test Personas...');
    const student1Auth = await login('student101@gmail.com', '123456');
    const student2Auth = await login('student102@gmail.com', '123456');
    const instAuth = await login('bitsathy@gmail.com', '123456');
    const adminAuth = await login('admin@nep.gov.in', 'Admin@123456');

    const s1UserId = (student1Auth.user._id || student1Auth.user.id).toString();
    const s2UserId = (student2Auth.user._id || student2Auth.user.id).toString();

    console.log(`   ✓ Student 1: ${student1Auth.user.name} (${student1Auth.user.email}) [${s1UserId}]`);
    console.log(`   ✓ Student 2: ${student2Auth.user.name} (${student2Auth.user.email}) [${s2UserId}]`);
    console.log(`   ✓ Institution: ${instAuth.user.name}`);
    console.log(`   ✓ Superadmin: ${adminAuth.user.name}\n`);

    // 2. Fetch Institutions for target policy testing
    const instListRes = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/institutions?all=true',
      method: 'GET',
      headers: { Authorization: `Bearer ${adminAuth.token}` },
    });
    const institutions =
      instListRes.body?.data?.institutions ||
      instListRes.body?.institutions ||
      (Array.isArray(instListRes.body?.data) ? instListRes.body?.data : []);
    assert(institutions.length >= 2, 'At least 2 institutions exist in DB');

    const destInst = institutions.find(
      (i) => (i._id || i.id).toString() !== student1Auth.user.institutionId?.toString()
    ) || institutions[1];

    console.log(`🎯 Selected Target Destination Institution: ${destInst.name} (${destInst.code})`);

    // SECTION 1: Student 1 Self-Roadmap Evaluation
    console.log('\n--- SECTION 1: Student 1 Self-Roadmap & Readiness Evaluation ---');
    const s1Res = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: `/api/students/readiness-roadmap/me?targetInstitutionId=${destInst._id || destInst.id}&pathwayGoal=graduation`,
      method: 'GET',
      headers: { Authorization: `Bearer ${student1Auth.token}` },
    });

    assert(s1Res.status === 200, 'Student 1 roadmap API returns 200');
    assert(s1Res.body.success === true, 'Response marked success');
    const s1Data = s1Res.body.data;

    assert(s1Data.student.email === student1Auth.user.email, 'Roadmap strictly scoped to Student 1 email');
    assert(s1Data.student.id.toString() === s1UserId, 'Roadmap strictly scoped to Student 1 ID');
    assert(typeof s1Data.summary.verifiedCredits === 'number', 'Summary contains numeric verifiedCredits');
    assert(typeof s1Data.readiness.eligibleCredits === 'number', 'Readiness contains numeric eligibleCredits');
    assert(typeof s1Data.readiness.degreeCreditGap === 'number', 'Contains degreeCreditGap');
    assert(Array.isArray(s1Data.readiness.evaluatedCredits), 'Contains evaluatedCredits array');
    assert(Array.isArray(s1Data.milestones), 'Contains milestones array');
    assert(s1Data.milestones.length === 4, 'Includes 4 NEP benchmark milestones');
    assert(Array.isArray(s1Data.recommendedNextSteps), 'Contains prioritized recommendedNextSteps array');
    assert(Array.isArray(s1Data.coursePathway), 'Contains prerequisite-aware coursePathway');
    assert(Boolean(s1Data.evidence?.policyApplied), 'Contains evidence and policyApplied audit');

    console.log(`   Student 1 Verified Credits: ${s1Data.summary.verifiedCredits}, Eligible for Transfer: ${s1Data.readiness.eligibleCredits}`);
    console.log(`   Degree Credit Gap: ${s1Data.readiness.degreeCreditGap}, Target Policy Version: ${s1Data.targetPolicy.version}`);

    // SECTION 2: Student 2 Individual Profile Analysis & Non-Identical Roadmaps
    console.log('\n--- SECTION 2: Student 2 Evaluation & Individual Differentiation ---');
    const s2Res = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: `/api/students/readiness-roadmap/me?targetInstitutionId=${destInst._id || destInst.id}&pathwayGoal=graduation`,
      method: 'GET',
      headers: { Authorization: `Bearer ${student2Auth.token}` },
    });

    assert(s2Res.status === 200, 'Student 2 roadmap API returns 200');
    const s2Data = s2Res.body.data;
    assert(s2Data.student.email === student2Auth.user.email, 'Roadmap strictly scoped to Student 2 email');
    assert(s2Data.student.id.toString() === s2UserId, 'Roadmap strictly scoped to Student 2 ID');
    assert(s1Data.student.id.toString() !== s2Data.student.id.toString(), 'Student 1 and Student 2 have separate distinct IDs');

    // SECTION 3: Strict Data Isolation & Anti-Tampering Security Checks
    console.log('\n--- SECTION 3: Data Isolation & Anti-Tampering Security Checks ---');

    // 3.1 Student attempting to access another student's roadmap via parameterized route
    const tamperRes = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: `/api/students/readiness-roadmap/${s2UserId}`,
      method: 'GET',
      headers: { Authorization: `Bearer ${student1Auth.token}` },
    });
    assert(tamperRes.status === 403, 'Student 1 blocked from accessing Student 2 roadmap with 403 Forbidden');

    // 3.2 Student attempting to spoof studentId in query parameter on /me route
    const spoofQueryRes = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: `/api/students/readiness-roadmap/me?studentId=${s2UserId}`,
      method: 'GET',
      headers: { Authorization: `Bearer ${student1Auth.token}` },
    });
    assert(spoofQueryRes.status === 200, 'Request succeeded');
    assert(spoofQueryRes.body.data.student.id.toString() === s1UserId, 'Server ignores client-supplied studentId and enforces req.user identity');

    // 3.3 Unauthenticated request
    const unauthRes = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/students/readiness-roadmap/me',
      method: 'GET',
    });
    assert(unauthRes.status === 401, 'Unauthenticated request correctly blocked with 401 Unauthorized');

    // SECTION 4: Institution & Admin Governance RBAC
    console.log('\n--- SECTION 4: Institution and Admin Governance RBAC ---');

    // 4.1 Institution viewing enrolled student
    const instViewRes = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: `/api/students/readiness-roadmap/${s1UserId}`,
      method: 'GET',
      headers: { Authorization: `Bearer ${instAuth.token}` },
    });
    assert(instViewRes.status === 200, 'Institution can view roadmap for its enrolled student');

    // 4.2 Superadmin viewing any student
    const adminViewRes = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: `/api/students/readiness-roadmap/${s2UserId}`,
      method: 'GET',
      headers: { Authorization: `Bearer ${adminAuth.token}` },
    });
    assert(adminViewRes.status === 200, 'Superadmin can view roadmap for any student in the hub');

    // SECTION 5: Policy Rules & Credit Gap Logic Validation
    console.log('\n--- SECTION 5: Policy Rules & Deterministic Calculation Checks ---');

    // 5.1 Test with Diploma pathway benchmark (80 credits)
    const diplomaRes = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: `/api/students/readiness-roadmap/me?pathwayGoal=diploma`,
      method: 'GET',
      headers: { Authorization: `Bearer ${student1Auth.token}` },
    });
    assert(diplomaRes.status === 200, 'Diploma pathway evaluation returns 200');
    assert(diplomaRes.body.data.pathwayGoal.requiredCredits === 80, 'Diploma required credits is 80');
    const expectedGap = Math.max(0, 80 - s1Data.summary.verifiedCredits);
    assert(diplomaRes.body.data.pathwayGoal.degreeCreditGap === expectedGap, `Diploma gap matches expected ${expectedGap}`);

    // 5.2 Validate credit explanations
    if (s1Data.readiness.evaluatedCredits.length > 0) {
      const sampleCredit = s1Data.readiness.evaluatedCredits[0];
      assert(Boolean(sampleCredit.readinessStatus), 'Evaluated credit contains readinessStatus');
      assert(Boolean(sampleCredit.reason), 'Evaluated credit contains plain-language explanation reason');
      assert(Boolean(sampleCredit.awardingInstitution), 'Evaluated credit lists awarding institution');
    }

    // SECTION 6: Zero-Credit Student & Incomplete Records Handling
    console.log('\n--- SECTION 6: Zero-Credit Account & Edge Case Handling ---');
    // Register a fresh zero-credit student
    const freshStudentEmail = `freshstudent_${Date.now()}@example.com`;
    const regRes = await makeRequest(
      {
        hostname: 'localhost',
        port: 5000,
        path: '/api/auth/register',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      {
        name: 'New Enrolled Student',
        email: freshStudentEmail,
        password: 'Password@123',
        role: 'student',
        institutionId: student1Auth.user.institutionId,
        studentId: `ABC-TEST-${Date.now().toString().slice(-6)}`,
      }
    );

    assert(regRes.status === 201, 'Fresh student account created');
    const freshToken = regRes.body.data.token;
    const freshUser = regRes.body.data.user;
    createdArtifacts.users.push(freshUser._id || freshUser.id);

    const freshRoadmapRes = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/students/readiness-roadmap/me',
      method: 'GET',
      headers: { Authorization: `Bearer ${freshToken}` },
    });

    assert(freshRoadmapRes.status === 200, 'Fresh zero-credit student roadmap returns 200');
    const freshRoadmap = freshRoadmapRes.body.data;
    assert(freshRoadmap.summary.verifiedCredits === 0, 'Zero verified credits reported');
    assert(freshRoadmap.summary.overallReadiness === 'INSUFFICIENT_INFO', 'Zero credit student marked INSUFFICIENT_INFO');
    assert(freshRoadmap.readiness.degreeCreditGap === 160, 'Degree credit gap equals full 160 credits required');
    assert(freshRoadmap.readiness.evaluatedCredits.length === 0, 'Evaluated credits array is empty');
    console.log(`   Fresh Student Status: ${freshRoadmap.summary.overallReadiness} - "${freshRoadmap.summary.overallReadinessSummary}"`);

    // SECTION 7: Low Grade, Unverified, and Already Transferred Credit Policies
    console.log('\n--- SECTION 7: Low Grade, Unverified, and Transferred Credit Rules ---');

    // Fetch an active course
    const sampleCourses = await Course.find({ institutionId: student1Auth.user.institutionId, isActive: true }).limit(3);
    assert(sampleCourses.length >= 3, 'Course found for edge-case credit testing');

    // 7.1 Create a Low Grade credit (Grade C, below target policy minimum B)
    const testHashLowGrade = generateCreditHash({
      studentId: freshUser._id,
      courseId: sampleCourses[0]._id,
      institutionId: student1Auth.user.institutionId,
      credits: 4,
      grade: 'C',
      semester: 1,
      academicYear: '2024-25',
    });

    const lowGradeCredit = await AcademicCredit.create({
      studentId: freshUser._id,
      courseId: sampleCourses[0]._id,
      institutionId: student1Auth.user.institutionId,
      credits: 4,
      grade: 'C',
      semester: 1,
      academicYear: '2024-25',
      verificationStatus: 'verified',
      integrityHash: testHashLowGrade,
    });
    createdArtifacts.credits.push(lowGradeCredit._id);

    // 7.2 Create an Unverified credit (Status pending)
    const testHashPending = generateCreditHash({
      studentId: freshUser._id,
      courseId: sampleCourses[1]._id,
      institutionId: student1Auth.user.institutionId,
      credits: 3,
      grade: 'A',
      semester: 1,
      academicYear: '2024-25',
    });

    const pendingCredit = await AcademicCredit.create({
      studentId: freshUser._id,
      courseId: sampleCourses[1]._id,
      institutionId: student1Auth.user.institutionId,
      credits: 3,
      grade: 'A',
      semester: 1,
      academicYear: '2024-25',
      verificationStatus: 'pending',
      integrityHash: testHashPending,
    });
    createdArtifacts.credits.push(pendingCredit._id);

    // 7.3 Create an Already Transferred credit (isTransferred = true)
    const testHashTransferred = generateCreditHash({
      studentId: freshUser._id,
      courseId: sampleCourses[2]._id,
      institutionId: student1Auth.user.institutionId,
      credits: 4,
      grade: 'O',
      semester: 1,
      academicYear: '2024-25',
    });

    const transferredCredit = await AcademicCredit.create({
      studentId: freshUser._id,
      courseId: sampleCourses[2]._id,
      institutionId: student1Auth.user.institutionId,
      credits: 4,
      grade: 'O',
      semester: 1,
      academicYear: '2024-25',
      verificationStatus: 'verified',
      integrityHash: testHashTransferred,
      isTransferred: true,
      transferredTo: destInst._id,
    });
    createdArtifacts.credits.push(transferredCredit._id);

    // Re-evaluate fresh student roadmap
    const edgeRoadmapRes = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: `/api/students/readiness-roadmap/me?targetInstitutionId=${destInst._id}`,
      method: 'GET',
      headers: { Authorization: `Bearer ${freshToken}` },
    });

    assert(edgeRoadmapRes.status === 200, 'Edge test evaluation returns 200');
    const edgeData = edgeRoadmapRes.body.data;

    const evaluatedLowGrade = edgeData.readiness.evaluatedCredits.find(
      (c) => c.creditId.toString() === lowGradeCredit._id.toString()
    );
    assert(Boolean(evaluatedLowGrade), 'Low-grade credit evaluated');
    assert(evaluatedLowGrade.readinessStatus === 'NOT_ELIGIBLE', 'Low grade C correctly marked NOT_ELIGIBLE against minGrade B');
    assert(evaluatedLowGrade.reason.includes('below'), 'Reason explains minimum grade threshold');

    const evaluatedPending = edgeData.readiness.evaluatedCredits.find(
      (c) => c.creditId.toString() === pendingCredit._id.toString()
    );
    assert(Boolean(evaluatedPending), 'Pending credit evaluated');
    assert(evaluatedPending.readinessStatus === 'NEEDS_REVIEW', 'Pending credit correctly marked NEEDS_REVIEW');
    assert(evaluatedPending.reason.includes('pending'), 'Reason explains pending verification status');

    const evaluatedTransferred = edgeData.readiness.evaluatedCredits.find(
      (c) => c.creditId.toString() === transferredCredit._id.toString()
    );
    assert(Boolean(evaluatedTransferred), 'Transferred credit evaluated');
    assert(evaluatedTransferred.readinessStatus === 'NOT_ELIGIBLE', 'Already transferred credit correctly marked NOT_ELIGIBLE');
    assert(evaluatedTransferred.reason.includes('permanently transferred'), 'Reason explains transfer prohibition and double-counting prevention');

    console.log('\n================================================================');
    console.log('🎉 ALL ROADMAP & READINESS VERIFICATION TESTS PASSED!');
    console.log(`   Total Tests Passed: ${passedTests}`);
    console.log(`   Total Tests Failed: ${failedTests}`);
    console.log('================================================================\n');

    // Safe Teardown
    console.log('🧹 Cleaning up test artifacts...');
    if (createdArtifacts.credits.length > 0) {
      await AcademicCredit.deleteMany({ _id: { $in: createdArtifacts.credits } });
      console.log(`   ✓ Cleaned ${createdArtifacts.credits.length} test credit(s)`);
    }
    if (createdArtifacts.users.length > 0) {
      await User.deleteMany({ _id: { $in: createdArtifacts.users } });
      console.log(`   ✓ Cleaned ${createdArtifacts.users.length} test student(s)`);
    }

    process.exit(0);
  } catch (err) {
    console.error('\n❌ Test Suite Aborted due to error:', err);

    // Teardown on failure
    if (createdArtifacts.credits.length > 0) {
      await AcademicCredit.deleteMany({ _id: { $in: createdArtifacts.credits } });
    }
    if (createdArtifacts.users.length > 0) {
      await User.deleteMany({ _id: { $in: createdArtifacts.users } });
    }

    process.exit(1);
  }
}

runRoadmapTests();
