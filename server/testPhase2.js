const http = require('http');

// Start backend server
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

async function runTests() {
  console.log('🧪 Starting Phase 2 Backend Verification Suite...\n');
  await new Promise((r) => setTimeout(r, 1200));

  const testId = Date.now().toString().slice(-4);
  const studentEmail = `student_${testId}@test.ac.in`;
  const instEmail = `dean_${testId}@iitb.ac.in`;
  const password = 'Password@123';

  let studentToken = null;
  let instToken = null;
  let instId = null;
  let adminToken = null;

  try {
    // 1. Institution Registration
    console.log('1️⃣  Testing Institution Registration...');
    const regInst = await makeRequest(
      {
        hostname: 'localhost',
        port: 5000,
        path: '/api/auth/register',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      {
        name: 'Dr. S. K. Nair',
        email: instEmail,
        password,
        role: 'institution',
        institutionName: 'Indian Institute of Technology Bombay',
        institutionCode: `IITB_${testId}`,
      }
    );
    console.log(`   Status: ${regInst.status} (Expected: 201)`);
    console.log(`   Response:`, regInst.body.message);
    if (regInst.status !== 201) throw new Error('Institution registration failed');
    instToken = regInst.body.data.token;
    instId = regInst.body.data.user.institutionId;

    // 2. Student Registration (with associated institutionId)
    console.log('\n2️⃣  Testing Student Registration (Associated with Institution)...');
    const regStudent = await makeRequest(
      {
        hostname: 'localhost',
        port: 5000,
        path: '/api/auth/register',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      {
        name: `Rahul Sharma ${testId}`,
        email: studentEmail,
        password,
        role: 'student',
        studentId: `ABC-9876${testId}`,
        institutionId: instId,
      }
    );
    console.log(`   Status: ${regStudent.status} (Expected: 201)`);
    console.log(`   Response:`, regStudent.body.message);
    if (regStudent.status !== 201) throw new Error('Student registration failed');
    studentToken = regStudent.body.data.token;

    // 3. Duplicate Email Prevention
    console.log('\n3️⃣  Testing Duplicate Email Prevention...');
    const dupTest = await makeRequest(
      {
        hostname: 'localhost',
        port: 5000,
        path: '/api/auth/register',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      {
        name: 'Duplicate User',
        email: studentEmail,
        password,
        role: 'student',
        institutionId: instId,
      }
    );
    console.log(`   Status: ${dupTest.status} (Expected: 409)`);
    console.log(`   Response:`, dupTest.body.message);
    if (dupTest.status !== 409) throw new Error('Duplicate email not rejected');

    // 4. Public Admin Registration Prevention
    console.log('\n4️⃣  Testing Public Admin Registration Prevention...');
    const adminBlockTest = await makeRequest(
      {
        hostname: 'localhost',
        port: 5000,
        path: '/api/auth/register',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      {
        name: 'Fake Admin',
        email: `hacker_${testId}@evil.com`,
        password,
        role: 'admin',
      }
    );
    console.log(`   Status: ${adminBlockTest.status} (Expected: 403)`);
    console.log(`   Response:`, adminBlockTest.body.message);
    if (adminBlockTest.status !== 403) throw new Error('Public admin registration was not blocked');

    // 5. Login with Valid Credentials
    console.log('\n5️⃣  Testing Login with Valid Credentials...');
    const validLogin = await makeRequest(
      {
        hostname: 'localhost',
        port: 5000,
        path: '/api/auth/login',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      {
        email: studentEmail,
        password,
      }
    );
    console.log(`   Status: ${validLogin.status} (Expected: 200)`);
    console.log(`   User Role:`, validLogin.body.data.user.role);
    if (validLogin.status !== 200) throw new Error('Valid login failed');

    // 6. Login with Invalid Credentials
    console.log('\n6️⃣  Testing Login with Invalid Password...');
    const invalidLogin = await makeRequest(
      {
        hostname: 'localhost',
        port: 5000,
        path: '/api/auth/login',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      {
        email: studentEmail,
        password: 'WrongPassword999',
      }
    );
    console.log(`   Status: ${invalidLogin.status} (Expected: 401)`);
    console.log(`   Response:`, invalidLogin.body.message);
    if (invalidLogin.status !== 401) throw new Error('Invalid login was not rejected');

    // 7. Login as Seeded Superadmin
    console.log('\n7️⃣  Testing Admin Login (Seeded)...');
    const adminLogin = await makeRequest(
      {
        hostname: 'localhost',
        port: 5000,
        path: '/api/auth/login',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      {
        email: 'admin@nep.gov.in',
        password: 'Admin@123456',
      }
    );
    console.log(`   Status: ${adminLogin.status} (Expected: 200)`);
    if (adminLogin.status !== 200) throw new Error('Admin login failed');
    adminToken = adminLogin.body.data.token;

    // 8. GET /api/auth/me with Valid JWT
    console.log('\n8️⃣  Testing GET /api/auth/me with Valid Token...');
    const meValid = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/me',
      method: 'GET',
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    console.log(`   Status: ${meValid.status} (Expected: 200)`);
    console.log(`   Authenticated User:`, meValid.body.data.user.email);
    if (meValid.status !== 200) throw new Error('GET /me with valid token failed');

    // 9. GET /api/auth/me without Token
    console.log('\n9️⃣  Testing GET /api/auth/me without Token...');
    const meNoToken = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/me',
      method: 'GET',
    });
    console.log(`   Status: ${meNoToken.status} (Expected: 401)`);
    console.log(`   Response:`, meNoToken.body.message);
    if (meNoToken.status !== 401) throw new Error('GET /me without token was not rejected');

    // 10. RBAC: Student accessing Student Route
    console.log('\n🔟 Testing RBAC: Student accessing Student Route...');
    const studentAccess = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/test/student',
      method: 'GET',
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    console.log(`   Status: ${studentAccess.status} (Expected: 200)`);
    if (studentAccess.status !== 200) throw new Error('Student access to student route failed');

    // 11. RBAC: Student attempting Institution Route (Forbidden)
    console.log('\n1️⃣1️⃣ Testing RBAC: Student attempting Institution Route (Expected 403)...');
    const studentToInst = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/test/institution',
      method: 'GET',
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    console.log(`   Status: ${studentToInst.status} (Expected: 403)`);
    console.log(`   Response:`, studentToInst.body.message);
    if (studentToInst.status !== 403) throw new Error('Student was not blocked from institution route');

    // 12. RBAC: Institution attempting Admin Route (Forbidden)
    console.log('\n1️⃣2️⃣ Testing RBAC: Institution attempting Admin Route (Expected 403)...');
    const instToAdmin = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/test/admin',
      method: 'GET',
      headers: { Authorization: `Bearer ${instToken}` },
    });
    console.log(`   Status: ${instToAdmin.status} (Expected: 403)`);
    console.log(`   Response:`, instToAdmin.body.message);
    if (instToAdmin.status !== 403) throw new Error('Institution was not blocked from admin route');

    // 13. RBAC: Admin accessing Admin Route
    console.log('\n1️⃣3️⃣ Testing RBAC: Admin accessing Admin Route (Expected 200)...');
    const adminAccess = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/test/admin',
      method: 'GET',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    console.log(`   Status: ${adminAccess.status} (Expected: 200)`);
    if (adminAccess.status !== 200) throw new Error('Admin access to admin route failed');

    console.log('\n🎉 ALL 13 BACKEND AUTH & RBAC TESTS PASSED SUCCESSFULLY!\n');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Test Suite Failed:', error.message);
    process.exit(1);
  }
}

runTests();
