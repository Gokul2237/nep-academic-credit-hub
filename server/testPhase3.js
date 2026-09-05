const http = require('http');
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

async function runPhase3Tests() {
  console.log('🧪 Starting Phase 3 Course & Academic Credit Verification Suite...\n');
  await new Promise((r) => setTimeout(r, 1200));

  const testId = Date.now().toString().slice(-4);
  const studentEmail = `student_p3_${testId}@test.ac.in`;
  const student2Email = `student2_p3_${testId}@test.ac.in`;
  const inst1Email = `dean_iitb_${testId}@iitb.ac.in`;
  const inst2Email = `dean_nitk_${testId}@nitk.ac.in`;
  const password = 'Password@123';

  let studentToken = null;
  let studentId = null;
  let student2Token = null;
  let student2Id = null;
  let inst1Token = null;
  let inst1Id = null;
  let inst2Token = null;
  let inst2Id = null;
  let adminToken = null;
  let course1Id = null;
  let course2Id = null;
  let credit1Id = null;

  try {
    // 0. Onboard Test Users
    console.log('0️⃣  Setting up test personas (Inst 1, Inst 2, Student 1, Student 2, Admin)...');

    // Register Inst 1 (IITB)
    const i1 = await makeRequest(
      { hostname: 'localhost', port: 5000, path: '/api/auth/register', method: 'POST', headers: { 'Content-Type': 'application/json' } },
      { name: 'Dr. IITB Officer', email: inst1Email, password, role: 'institution', institutionName: 'IIT Bombay', institutionCode: `IITB_${testId}` }
    );
    inst1Token = i1.body.data.token;
    inst1Id = i1.body.data.user.institutionId;

    // Register Inst 2 (NITK)
    const i2 = await makeRequest(
      { hostname: 'localhost', port: 5000, path: '/api/auth/register', method: 'POST', headers: { 'Content-Type': 'application/json' } },
      { name: 'Dr. NITK Officer', email: inst2Email, password, role: 'institution', institutionName: 'NIT Karnataka', institutionCode: `NITK_${testId}` }
    );
    inst2Token = i2.body.data.token;
    inst2Id = i2.body.data.user.institutionId;

    // Verify Student Registration fails without institutionId
    const sFail = await makeRequest(
      { hostname: 'localhost', port: 5000, path: '/api/auth/register', method: 'POST', headers: { 'Content-Type': 'application/json' } },
      { name: 'No Inst Student', email: `fail_${testId}@test.ac.in`, password, role: 'student' }
    );
    if (sFail.status !== 400) throw new Error('Student registration without institutionId was not rejected');

    // Register Student 1 (belongs to Inst 1)
    const s1 = await makeRequest(
      { hostname: 'localhost', port: 5000, path: '/api/auth/register', method: 'POST', headers: { 'Content-Type': 'application/json' } },
      { name: 'Aarav Sharma', email: studentEmail, password, role: 'student', studentId: `ABC-P3-${testId}`, institutionId: inst1Id }
    );
    studentToken = s1.body.data.token;
    studentId = s1.body.data.user._id;

    // Register Student 2 (belongs to Inst 2)
    const s2 = await makeRequest(
      { hostname: 'localhost', port: 5000, path: '/api/auth/register', method: 'POST', headers: { 'Content-Type': 'application/json' } },
      { name: 'Diya Sen', email: student2Email, password, role: 'student', studentId: `ABC-P3-2-${testId}`, institutionId: inst2Id }
    );
    student2Token = s2.body.data.token;
    student2Id = s2.body.data.user._id;

    // Login Admin
    const adm = await makeRequest(
      { hostname: 'localhost', port: 5000, path: '/api/auth/login', method: 'POST', headers: { 'Content-Type': 'application/json' } },
      { email: 'admin@nep.gov.in', password: 'Admin@123456' }
    );
    adminToken = adm.body.data.token;
    console.log('   ✓ Personas successfully onboarded with validated institution associations\n');

    // 1. Institution 1 creates a Course
    console.log('1️⃣  Testing Course Creation (Institution 1)...');
    const c1 = await makeRequest(
      { hostname: 'localhost', port: 5000, path: '/api/courses', method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${inst1Token}` } },
      {
        courseCode: `CS501_${testId}`,
        courseName: 'Database Management Systems',
        description: 'Relational DBs, Normalization, SQL & Distributed Transactions',
        credits: 4,
        department: 'Computer Science & Engineering',
        semester: 5,
        courseLevel: 'Undergraduate',
      }
    );
    console.log(`   Status: ${c1.status} (Expected: 201)`);
    if (c1.status !== 201) throw new Error(`Course creation failed: ${JSON.stringify(c1.body)}`);
    course1Id = c1.body.data._id;
    console.log(`   Created Course: ${c1.body.data.courseCode} (${c1.body.data.credits} credits)`);

    // 2. Reject Invalid Credits (e.g. 0 or -5)
    console.log('\n2️⃣  Testing Invalid Credit Value Rejection (Credits = 0)...');
    const invCred = await makeRequest(
      { hostname: 'localhost', port: 5000, path: '/api/courses', method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${inst1Token}` } },
      {
        courseCode: `INVALID_${testId}`,
        courseName: 'Invalid Credits Course',
        credits: 0,
        department: 'CSE',
        semester: 1,
      }
    );
    console.log(`   Status: ${invCred.status} (Expected: 400)`);
    if (invCred.status !== 400) throw new Error('Invalid credits was not rejected');

    // 3. Institution 1 edits own Course
    console.log('\n3️⃣  Testing Course Update by Owner Institution...');
    const c1Update = await makeRequest(
      { hostname: 'localhost', port: 5000, path: `/api/courses/${course1Id}`, method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${inst1Token}` } },
      { description: 'Updated: Advanced Distributed Database Systems with NoSQL' }
    );
    console.log(`   Status: ${c1Update.status} (Expected: 200)`);
    if (c1Update.status !== 200) throw new Error('Course update failed');

    // 4. Institution 2 cannot modify Institution 1's Course (Tenant Isolation)
    console.log('\n4️⃣  Testing Tenant Isolation: Inst 2 modifying Inst 1 Course (Expected 403)...');
    const c1Hacked = await makeRequest(
      { hostname: 'localhost', port: 5000, path: `/api/courses/${course1Id}`, method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${inst2Token}` } },
      { courseName: 'Hacked Title' }
    );
    console.log(`   Status: ${c1Hacked.status} (Expected: 403)`);
    if (c1Hacked.status !== 403) throw new Error('Tenant isolation failed: Inst 2 modified Inst 1 course');

    // 5. Student cannot create a Course (RBAC)
    console.log('\n5️⃣  Testing Student creating Course (Expected 403)...');
    const stdCreate = await makeRequest(
      { hostname: 'localhost', port: 5000, path: '/api/courses', method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${studentToken}` } },
      { courseCode: 'STD101', courseName: 'Fake Student Course', credits: 4, department: 'CSE', semester: 1 }
    );
    console.log(`   Status: ${stdCreate.status} (Expected: 403)`);
    if (stdCreate.status !== 403) throw new Error('Student was able to create a course');

    // 6. Student can view active Course Catalog
    console.log('\n6️⃣  Testing Student viewing Course Catalog...');
    const stdCatalog = await makeRequest(
      { hostname: 'localhost', port: 5000, path: '/api/courses', method: 'GET', headers: { Authorization: `Bearer ${studentToken}` } }
    );
    console.log(`   Status: ${stdCatalog.status} (Expected: 200)`);
    console.log(`   Courses count: ${stdCatalog.body.data.length}`);
    if (stdCatalog.status !== 200 || stdCatalog.body.data.length === 0) throw new Error('Student catalog retrieval failed');

    // 7. Institution 1 awards Academic Credit to Student 1
    console.log('\n7️⃣  Testing Academic Credit Awarding with SHA-256 Integrity Hash...');
    const awardCred = await makeRequest(
      { hostname: 'localhost', port: 5000, path: '/api/credits', method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${inst1Token}` } },
      {
        studentEmail,
        courseId: course1Id,
        credits: 4,
        grade: 'A+',
        semester: 5,
        academicYear: '2025-26',
        verificationStatus: 'verified',
      }
    );
    console.log(`   Status: ${awardCred.status} (Expected: 201)`);
    if (awardCred.status !== 201) throw new Error(`Credit awarding failed: ${JSON.stringify(awardCred.body)}`);
    credit1Id = awardCred.body.data._id;
    console.log(`   Credit Hash: ${awardCred.body.data.integrityHash}`);
    if (!awardCred.body.data.integrityHash || awardCred.body.data.integrityHash.length !== 64) {
      throw new Error('Invalid SHA-256 integrity hash');
    }

    // 8. Verify Credit Integrity Check
    console.log('\n8️⃣  Testing Credit Record Integrity Verification...');
    const credDetail = await makeRequest(
      { hostname: 'localhost', port: 5000, path: `/api/credits/${credit1Id}`, method: 'GET', headers: { Authorization: `Bearer ${studentToken}` } }
    );
    console.log(`   Status: ${credDetail.status} (Expected: 200)`);
    console.log(`   Integrity Verified: ${credDetail.body.data.integrityVerified}`);
    if (!credDetail.body.data.integrityVerified) throw new Error('Credit integrity check failed');

    // 9. Prevent Duplicate Credit Awarding (Same student + course + term)
    console.log('\n9️⃣  Testing Duplicate Credit Prevention (Expected 409 Conflict)...');
    const dupCred = await makeRequest(
      { hostname: 'localhost', port: 5000, path: '/api/credits', method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${inst1Token}` } },
      {
        studentEmail,
        courseId: course1Id,
        credits: 4,
        grade: 'O',
        semester: 5,
        academicYear: '2025-26',
      }
    );
    console.log(`   Status: ${dupCred.status} (Expected: 409)`);
    console.log(`   Response: ${dupCred.body.message}`);
    if (dupCred.status !== 409) throw new Error('Duplicate credit entry was not prevented');

    // 10. Student cannot modify academic credit record (RBAC)
    console.log('\n🔟 Testing Student modifying Academic Credit (Expected 403)...');
    const stdModCred = await makeRequest(
      { hostname: 'localhost', port: 5000, path: `/api/credits/${credit1Id}`, method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${studentToken}` } },
      { grade: 'O', credits: 20 }
    );
    console.log(`   Status: ${stdModCred.status} (Expected: 403)`);
    if (stdModCred.status !== 403) throw new Error('Student was able to modify credit record');

    // 11. Institution 2 cannot modify Institution 1's credit record (Tenant Isolation)
    console.log('\n1️⃣1️⃣ Testing Tenant Isolation: Inst 2 modifying Inst 1 Credit (Expected 403)...');
    const inst2ModCred = await makeRequest(
      { hostname: 'localhost', port: 5000, path: `/api/credits/${credit1Id}`, method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${inst2Token}` } },
      { grade: 'F' }
    );
    console.log(`   Status: ${inst2ModCred.status} (Expected: 403)`);
    if (inst2ModCred.status !== 403) throw new Error('Inst 2 was able to modify Inst 1 credit');

    // 12. Student 1 cannot view Student 2's private credits
    console.log('\n1️⃣2️⃣ Testing Student 1 querying Student 2 Credits (Expected 403)...');
    const stdSpy = await makeRequest(
      { hostname: 'localhost', port: 5000, path: `/api/credits/student/${student2Id}`, method: 'GET', headers: { Authorization: `Bearer ${studentToken}` } }
    );
    console.log(`   Status: ${stdSpy.status} (Expected: 403)`);
    if (stdSpy.status !== 403) throw new Error('Student 1 was able to spy on Student 2 credits');

    // 13. Student Credit Wallet Summary Calculation
    console.log('\n1️⃣3️⃣ Testing Student Credit Wallet Summary Calculation...');
    const wallet = await makeRequest(
      { hostname: 'localhost', port: 5000, path: '/api/credits/wallet-summary', method: 'GET', headers: { Authorization: `Bearer ${studentToken}` } }
    );
    console.log(`   Status: ${wallet.status} (Expected: 200)`);
    console.log(`   Total Credits: ${wallet.body.data.totalCredits}, Verified: ${wallet.body.data.verifiedCredits}`);
    if (wallet.body.data.totalCredits !== 4 || wallet.body.data.verifiedCredits !== 4) {
      throw new Error('Wallet summary credit calculation mismatch');
    }

    // 14. Student Credit Timeline Structure
    console.log('\n1️⃣4️⃣ Testing Student Credit Timeline Structure...');
    const timeline = await makeRequest(
      { hostname: 'localhost', port: 5000, path: '/api/credits/timeline', method: 'GET', headers: { Authorization: `Bearer ${studentToken}` } }
    );
    console.log(`   Status: ${timeline.status} (Expected: 200)`);
    console.log(`   Timeline Years:`, Object.keys(timeline.body.data));
    if (!timeline.body.data['2025-26']) throw new Error('Timeline missing 2025-26 year node');

    // 15. Admin views Global Credit Ledger
    console.log('\n1️⃣5️⃣ Testing Admin viewing Global Credit Ledger...');
    const adminCredits = await makeRequest(
      { hostname: 'localhost', port: 5000, path: '/api/credits', method: 'GET', headers: { Authorization: `Bearer ${adminToken}` } }
    );
    console.log(`   Status: ${adminCredits.status} (Expected: 200)`);
    console.log(`   Admin saw ${adminCredits.body.data.length} total records across institutions`);
    if (adminCredits.status !== 200 || adminCredits.body.data.length === 0) throw new Error('Admin ledger access failed');

    // 16. Institution 2 cannot award credit to Institution 1's Student (Tenant Isolation on Credit Issuance)
    console.log('\n1️⃣6️⃣ Testing Tenant Isolation: Inst 2 awarding credit to Inst 1 Student (Expected 403)...');
    // First let Inst 2 create its own course
    const c2 = await makeRequest(
      { hostname: 'localhost', port: 5000, path: '/api/courses', method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${inst2Token}` } },
      { courseCode: `NITK101_${testId}`, courseName: 'Data Structures', credits: 4, department: 'CSE', semester: 3 }
    );
    course2Id = c2.body.data._id;

    const crossInstCredit = await makeRequest(
      { hostname: 'localhost', port: 5000, path: '/api/credits', method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${inst2Token}` } },
      {
        studentEmail, // Student 1 belongs to Inst 1!
        courseId: course2Id,
        credits: 4,
        grade: 'A',
        semester: 3,
        academicYear: '2025-26',
      }
    );
    console.log(`   Status: ${crossInstCredit.status} (Expected: 403)`);
    console.log(`   Response: ${crossInstCredit.body.message}`);
    if (crossInstCredit.status !== 403) throw new Error('Cross-institution credit award was not blocked');

    // 17. Institution 1 queries GET /api/students (only sees its own students)
    console.log('\n1️⃣7️⃣ Testing Institution Student Scoping: Inst 1 only sees own students...');
    const inst1Students = await makeRequest(
      { hostname: 'localhost', port: 5000, path: '/api/students', method: 'GET', headers: { Authorization: `Bearer ${inst1Token}` } }
    );
    console.log(`   Status: ${inst1Students.status} (Expected: 200)`);
    const student1Found = inst1Students.body.data.some((s) => s.email === studentEmail);
    const student2Found = inst1Students.body.data.some((s) => s.email === student2Email);
    console.log(`   Inst 1 student count: ${inst1Students.body.data.length}, Found Student 1: ${student1Found}, Found Student 2: ${student2Found}`);
    if (!student1Found || student2Found) throw new Error('Institution student list leakage or missing own student');

    // 18. Student cannot access GET /api/students (RBAC: 403)
    console.log('\n1️⃣8️⃣ Testing Student accessing /api/students (Expected 403)...');
    const stdStudentsAccess = await makeRequest(
      { hostname: 'localhost', port: 5000, path: '/api/students', method: 'GET', headers: { Authorization: `Bearer ${studentToken}` } }
    );
    console.log(`   Status: ${stdStudentsAccess.status} (Expected: 403)`);
    if (stdStudentsAccess.status !== 403) throw new Error('Student was able to access /api/students');

    // 19. Admin queries GET /api/students (sees all active students)
    console.log('\n1️⃣9️⃣ Testing Admin accessing /api/students (sees all students across institutions)...');
    const adminStudents = await makeRequest(
      { hostname: 'localhost', port: 5000, path: '/api/students', method: 'GET', headers: { Authorization: `Bearer ${adminToken}` } }
    );
    console.log(`   Status: ${adminStudents.status} (Expected: 200)`);
    const adminHasS1 = adminStudents.body.data.some((s) => s.email === studentEmail);
    const adminHasS2 = adminStudents.body.data.some((s) => s.email === student2Email);
    console.log(`   Admin sees S1: ${adminHasS1}, S2: ${adminHasS2}`);
    if (!adminHasS1 || !adminHasS2) throw new Error('Admin could not see all students');

    console.log('\n🎉 ALL 19 PHASE 3 & TENANT ISOLATION BACKEND TESTS PASSED SUCCESSFULLY!\n');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Phase 3 Test Suite Failed:', error.message);
    process.exit(1);
  }
}

runPhase3Tests();
