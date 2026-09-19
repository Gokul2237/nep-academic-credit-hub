const http = require('http');
const mongoose = require('mongoose');
require('./server.js');

const BASE_URL = 'http://localhost:5000';

// ------------------------------------------------------------
// Helpers
// ------------------------------------------------------------

const sleep = (ms) =>
  new Promise((resolve) => setTimeout(resolve, ms));

const request = (method, path, body = null, token = null) => {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE_URL + path);

    const payload = body ? JSON.stringify(body) : null;

    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (payload) {
      options.headers['Content-Length'] =
        Buffer.byteLength(payload);
    }

    if (token) {
      options.headers.Authorization = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        let parsed = {};

        try {
          parsed = data ? JSON.parse(data) : {};
        } catch {
          parsed = { raw: data };
        }

        resolve({
          status: res.statusCode,
          body: parsed,
        });
      });
    });

    req.on('error', reject);

    if (payload) {
      req.write(payload);
    }

    req.end();
  });
};

const extractData = (response) => {
  return (
    response.body?.data ??
    response.body?.result ??
    response.body
  );
};

const getId = (value) => {
  if (!value) return null;

  if (typeof value === 'string') {
    return value;
  }

  if (value.user) {
    if (value.user.role === 'institution') {
      return (value.user.institutionId || value.user._id).toString();
    }
    return value.user._id.toString();
  }

  if (value._id) return value._id.toString();
  if (value.id) return value.id.toString();
  return null;
};

const assertStatus = (actual, expected, testName) => {
  if (actual !== expected) {
    throw new Error(
      `${testName} - Expected ${expected}, received ${actual}`
    );
  }
};

const pass = (number, message) => {
  console.log(`✅ ${number}. ${message}`);
};

const fail = (number, message, error) => {
  console.error(`❌ ${number}. ${message}`);
  console.error(`   ${error.message}`);
};

// ------------------------------------------------------------
// Test data
// ------------------------------------------------------------

const timestamp = Date.now();

const student1 = {
  name: `Phase5 Student 1 ${timestamp}`,
  email: `phase5student1_${timestamp}@test.com`,
  password: 'Password@123',
  role: 'student',
  studentId: `STU1-${timestamp}`,
};

const student2 = {
  name: `Phase5 Student 2 ${timestamp}`,
  email: `phase5student2_${timestamp}@test.com`,
  password: 'Password@123',
  role: 'student',
  studentId: `STU2-${timestamp}`,
};

const institution1 = {
  name: `Dr. Phase5 Inst 1 ${timestamp}`,
  email: `phase5inst1_${timestamp}@test.com`,
  password: 'Password@123',
  role: 'institution',
  institutionName: `Phase 5 Institution 1 ${timestamp}`,
  institutionCode: `P5I1_${timestamp}`,
};

const institution2 = {
  name: `Dr. Phase5 Inst 2 ${timestamp}`,
  email: `phase5inst2_${timestamp}@test.com`,
  password: 'Password@123',
  role: 'institution',
  institutionName: `Phase 5 Institution 2 ${timestamp}`,
  institutionCode: `P5I2_${timestamp}`,
};

let student1Token;
let student2Token;
let institution1Token;
let institution2Token;
let adminToken;

let institution1Id;
let institution2Id;
let student1Id;
let student2Id;
let course1Id;
let course2Id;
let credit1Id;
let credit2Id;
let certificate1Id;
let certificate1PublicId;

// ------------------------------------------------------------
// Registration / login helpers
// ------------------------------------------------------------

async function registerUser(user) {
  const response = await request(
    'POST',
    '/api/auth/register',
    user
  );

  return response;
}

async function login(email, password) {
  const response = await request(
    'POST',
    '/api/auth/login',
    {
      email,
      password,
    }
  );

  if (response.status !== 200) {
    throw new Error(
      `Login failed for ${email}: ${JSON.stringify(
        response.body
      )}`
    );
  }

  const data = extractData(response);

  return (
    data?.token ||
    data?.accessToken ||
    response.body?.token ||
    response.body?.accessToken
  );
}

// ------------------------------------------------------------
// Main test runner
// ------------------------------------------------------------

async function runTests() {
  console.log('\n==============================================');
  console.log(' PHASE 5.2 CERTIFICATE API TEST SUITE');
  console.log('==============================================\n');
  await sleep(1500);

  let testNumber = 0;
  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    testNumber++;

    try {
      await fn();
      pass(testNumber, name);
      passed++;
    } catch (error) {
      fail(testNumber, name, error);
      failed++;
    }
  }

  // ----------------------------------------------------------
  // Setup
  // ----------------------------------------------------------

  await test(
    'Server is reachable',
    async () => {
      const response = await request(
        'GET',
        '/api/certificates/verify/INVALID-PHASE5-ID'
      );

      if (![400, 404].includes(response.status)) {
        throw new Error(
          `Unexpected status ${response.status}`
        );
      }
    }
  );

  // ----------------------------------------------------------
  // Create institution 1
  // ----------------------------------------------------------

  await test(
    'Institution 1 registration',
    async () => {
      const response = await registerUser(
        institution1
      );

      assertStatus(
        response.status,
        201,
        'Institution 1 registration'
      );

      const data = extractData(response);

      institution1Id = getId(data);

      if (!institution1Id) {
        throw new Error(
          'Institution 1 ID was not returned'
        );
      }
    }
  );

  // ----------------------------------------------------------
  // Create institution 2
  // ----------------------------------------------------------

  await test(
    'Institution 2 registration',
    async () => {
      const response = await registerUser(
        institution2
      );

      assertStatus(
        response.status,
        201,
        'Institution 2 registration'
      );

      const data = extractData(response);

      institution2Id = getId(data);

      if (!institution2Id) {
        throw new Error(
          'Institution 2 ID was not returned'
        );
      }
    }
  );

  // ----------------------------------------------------------
  // Student 1
  // ----------------------------------------------------------

  await test(
    'Student 1 registration with Institution 1',
    async () => {
      const response = await registerUser({
        ...student1,
        institutionId: institution1Id,
      });

      assertStatus(
        response.status,
        201,
        'Student 1 registration'
      );

      const data = extractData(response);

      student1Id = getId(data);

      if (!student1Id) {
        throw new Error(
          'Student 1 ID was not returned'
        );
      }
    }
  );

  // ----------------------------------------------------------
  // Student 2
  // ----------------------------------------------------------

  await test(
    'Student 2 registration with Institution 2',
    async () => {
      const response = await registerUser({
        ...student2,
        institutionId: institution2Id,
      });

      assertStatus(
        response.status,
        201,
        'Student 2 registration'
      );

      const data = extractData(response);

      student2Id = getId(data);

      if (!student2Id) {
        throw new Error(
          'Student 2 ID was not returned'
        );
      }
    }
  );

  // ----------------------------------------------------------
  // Logins
  // ----------------------------------------------------------

  await test(
    'Institution 1 login',
    async () => {
      institution1Token = await login(
        institution1.email,
        institution1.password
      );

      if (!institution1Token) {
        throw new Error(
          'Institution 1 JWT not returned'
        );
      }
    }
  );

  await test(
    'Institution 2 login',
    async () => {
      institution2Token = await login(
        institution2.email,
        institution2.password
      );

      if (!institution2Token) {
        throw new Error(
          'Institution 2 JWT not returned'
        );
      }
    }
  );

  await test(
    'Student 1 login',
    async () => {
      student1Token = await login(
        student1.email,
        student1.password
      );

      if (!student1Token) {
        throw new Error(
          'Student 1 JWT not returned'
        );
      }
    }
  );

  await test(
    'Student 2 login',
    async () => {
      student2Token = await login(
        student2.email,
        student2.password
      );

      if (!student2Token) {
        throw new Error(
          'Student 2 JWT not returned'
        );
      }
    }
  );

  // ----------------------------------------------------------
  // Admin login
  // ----------------------------------------------------------

  await test(
    'Seeded admin login',
    async () => {
      adminToken = await login(
        'admin@nep.gov.in',
        'Admin@123456'
      );

      if (!adminToken) {
        throw new Error(
          'Admin JWT not returned'
        );
      }
    }
  );


  // ----------------------------------------------------------
  // Create course
  // ----------------------------------------------------------

  await test(
    'Institution 1 creates course',
    async () => {
      const response = await request(
        'POST',
        '/api/courses',
        {
          courseCode: `P5C1_${timestamp.toString().slice(-4)}`,
          courseName: 'Phase 5 Certificate Testing',
          credits: 4,
          department: 'Computer Science',
          semester: 5,
          courseLevel: 'Undergraduate',
        },
        institution1Token
      );

      assertStatus(
        response.status,
        201,
        'Course creation'
      );

      const data = extractData(response);

      course1Id = getId(data);

      if (!course1Id) {
        throw new Error(
          'Course ID was not returned'
        );
      }
    }
  );

  // ----------------------------------------------------------
  // Create second course
  // ----------------------------------------------------------

  await test(
    'Institution 2 creates course',
    async () => {
      const response = await request(
        'POST',
        '/api/courses',
        {
          courseCode: `P5C2_${timestamp.toString().slice(-4)}`,
          courseName: 'Phase 5 Cross Institution Course',
          credits: 3,
          department: 'Computer Science',
          semester: 5,
          courseLevel: 'Undergraduate',
        },
        institution2Token
      );

      assertStatus(
        response.status,
        201,
        'Course 2 creation'
      );

      const data = extractData(response);

      course2Id = getId(data);

      if (!course2Id) {
        throw new Error(
          'Course 2 ID was not returned'
        );
      }
    }
  );

  // ----------------------------------------------------------
  // Create verified credit 1
  // ----------------------------------------------------------

  await test(
    'Institution 1 creates verified academic credit',
    async () => {
      const response = await request(
        'POST',
        '/api/credits',
        {
          studentId: student1Id,
          courseId: course1Id,
          institutionId: institution1Id,
          credits: 4,
          grade: 'A',
          semester: 5,
          academicYear: '2026-27',
          verificationStatus: 'verified',
          sourceType: 'institution',
        },
        institution1Token
      );

      assertStatus(
        response.status,
        201,
        'Verified credit creation'
      );

      const data = extractData(response);

      credit1Id = getId(data);

      if (!credit1Id) {
        throw new Error(
          'Academic credit ID was not returned'
        );
      }
    }
  );

  // ----------------------------------------------------------
  // Create pending credit 2
  // ----------------------------------------------------------

  await test(
    'Institution 2 creates unverified academic credit',
    async () => {
      const response = await request(
        'POST',
        '/api/credits',
        {
          studentId: student2Id,
          courseId: course2Id,
          institutionId: institution2Id,
          credits: 3,
          grade: 'B+',
          semester: 5,
          academicYear: '2026-27',
          verificationStatus: 'pending',
          sourceType: 'institution',
        },
        institution2Token
      );

      assertStatus(
        response.status,
        201,
        'Pending credit creation'
      );

      const data = extractData(response);

      credit2Id = getId(data);

      if (!credit2Id) {
        throw new Error(
          'Second academic credit ID was not returned'
        );
      }
    }
  );

  // ----------------------------------------------------------
  // Certificate creation
  // ----------------------------------------------------------

  await test(
    'Student cannot issue a certificate',
    async () => {
      const response = await request(
        'POST',
        '/api/certificates',
        {
          academicCreditId: credit1Id,
          title: 'Unauthorized Certificate',
          certificateType: 'course_completion',
        },
        student1Token
      );

      assertStatus(
        response.status,
        403,
        'Student certificate creation'
      );
    }
  );

  await test(
    'Institution cannot issue certificate for another institution credit',
    async () => {
      const response = await request(
        'POST',
        '/api/certificates',
        {
          academicCreditId: credit1Id,
          title: 'Cross Institution Certificate',
          certificateType: 'course_completion',
        },
        institution2Token
      );

      assertStatus(
        response.status,
        403,
        'Cross institution certificate creation'
      );
    }
  );

  await test(
    'Certificate cannot be issued for unverified academic credit',
    async () => {
      const response = await request(
        'POST',
        '/api/certificates',
        {
          academicCreditId: credit2Id,
          title: 'Pending Credit Certificate',
          certificateType: 'course_completion',
        },
        institution2Token
      );

      assertStatus(
        response.status,
        400,
        'Certificate for pending credit'
      );
    }
  );

  await test(
    'Institution 1 issues certificate for verified credit',
    async () => {
      const response = await request(
        'POST',
        '/api/certificates',
        {
          academicCreditId: credit1Id,
          title: 'Advanced Academic Achievement',
          certificateType: 'course_completion',
          documentUrl:
            'https://example.com/phase5-certificate.pdf',
        },
        institution1Token
      );

      assertStatus(
        response.status,
        201,
        'Certificate creation'
      );

      const data = extractData(response);

      certificate1Id = getId(data);

      certificate1PublicId =
        data?.certificateId ||
        data?.data?.certificateId;

      if (!certificate1Id) {
        throw new Error(
          'Certificate MongoDB ID was not returned'
        );
      }

      if (!certificate1PublicId) {
        throw new Error(
          'Public certificateId was not returned'
        );
      }

      if (!data.integrityHash) {
        throw new Error(
          'Certificate integrity hash was not generated'
        );
      }

      if (
        data.verificationStatus !==
        'pending'
      ) {
        throw new Error(
          `Expected pending status, received ${data.verificationStatus}`
        );
      }
    }
  );

  // ----------------------------------------------------------
  // Duplicate prevention
  // ----------------------------------------------------------

  await test(
    'Duplicate certificate for same academic credit is rejected',
    async () => {
      const response = await request(
        'POST',
        '/api/certificates',
        {
          academicCreditId: credit1Id,
          title: 'Duplicate Certificate',
          certificateType: 'course_completion',
        },
        institution1Token
      );

      assertStatus(
        response.status,
        409,
        'Duplicate certificate prevention'
      );
    }
  );

  // ----------------------------------------------------------
  // Certificate listing
  // ----------------------------------------------------------

  await test(
    'Student can view own certificates',
    async () => {
      const response = await request(
        'GET',
        '/api/certificates',
        null,
        student1Token
      );

      assertStatus(
        response.status,
        200,
        'Student certificate listing'
      );

      const data = extractData(response);

      const records =
        Array.isArray(data)
          ? data
          : data?.records ||
            data?.items ||
            data?.data ||
            [];

      if (!Array.isArray(records)) {
        throw new Error(
          'Certificate list was not returned as an array'
        );
      }

      const found = records.some(
        (certificate) =>
          certificate._id?.toString() ===
            certificate1Id?.toString() ||
          certificate.certificateId ===
            certificate1PublicId
      );

      if (!found) {
        throw new Error(
          'Student 1 certificate was not found in own certificate list'
        );
      }
    }
  );

  await test(
    'Student cannot view another student certificate directly',
    async () => {
      const response = await request(
        'GET',
        `/api/certificates/${certificate1Id}`,
        null,
        student2Token
      );

      assertStatus(
        response.status,
        403,
        'Cross student certificate access'
      );
    }
  );

  await test(
    'Institution 1 can view its certificates',
    async () => {
      const response = await request(
        'GET',
        '/api/certificates',
        null,
        institution1Token
      );

      assertStatus(
        response.status,
        200,
        'Institution certificate listing'
      );
    }
  );

  await test(
    'Institution 2 cannot view Institution 1 certificate directly',
    async () => {
      const response = await request(
        'GET',
        `/api/certificates/${certificate1Id}`,
        null,
        institution2Token
      );

      assertStatus(
        response.status,
        403,
        'Cross institution certificate access'
      );
    }
  );

  // ----------------------------------------------------------
  // Certificate details + integrity
  // ----------------------------------------------------------

  await test(
    'Certificate details return integrityVerified=true',
    async () => {
      const response = await request(
        'GET',
        `/api/certificates/${certificate1Id}`,
        null,
        student1Token
      );

      assertStatus(
        response.status,
        200,
        'Certificate details'
      );

      const data = extractData(response);

      if (data.integrityVerified !== true) {
        throw new Error(
          `Expected integrityVerified=true, received ${data.integrityVerified}`
        );
      }
    }
  );

  // ----------------------------------------------------------
  // Public verification before approval
  // ----------------------------------------------------------

  await test(
    'Public certificate verification works before approval',
    async () => {
      const response = await request(
        'GET',
        `/api/certificates/verify/${certificate1PublicId}`
      );

      assertStatus(
        response.status,
        200,
        'Public certificate verification'
      );

      const data = extractData(response);

      if (data.integrityVerified !== true) {
        throw new Error(
          'Public verification did not confirm certificate integrity'
        );
      }

      if (data.isValid !== false) {
        throw new Error(
          'Pending certificate should not be publicly valid'
        );
      }

      if (
        data.verificationStatus !==
        'pending'
      ) {
        throw new Error(
          `Expected pending status, received ${data.verificationStatus}`
        );
      }
    }
  );

  // ----------------------------------------------------------
  // Invalid public verification
  // ----------------------------------------------------------

  await test(
    'Invalid public certificate ID returns 404',
    async () => {
      const response = await request(
        'GET',
        '/api/certificates/verify/NEP-CERT-INVALID-999999'
      );

      assertStatus(
        response.status,
        404,
        'Invalid public certificate ID'
      );
    }
  );

  // ----------------------------------------------------------
  // Unauthorized review
  // ----------------------------------------------------------

  await test(
    'Student cannot verify certificate',
    async () => {
      const response = await request(
        'PUT',
        `/api/certificates/${certificate1Id}/verify`,
        {
          verificationStatus: 'verified',
        },
        student1Token
      );

      assertStatus(
        response.status,
        403,
        'Student certificate review'
      );
    }
  );

  await test(
    'Institution 2 cannot verify Institution 1 certificate',
    async () => {
      const response = await request(
        'PUT',
        `/api/certificates/${certificate1Id}/verify`,
        {
          verificationStatus: 'verified',
        },
        institution2Token
      );

      assertStatus(
        response.status,
        403,
        'Cross institution certificate review'
      );
    }
  );

  // ----------------------------------------------------------
  // Certificate verification
  // ----------------------------------------------------------

  await test(
    'Institution 1 verifies certificate',
    async () => {
      const response = await request(
        'PUT',
        `/api/certificates/${certificate1Id}/verify`,
        {
          verificationStatus: 'verified',
        },
        institution1Token
      );

      assertStatus(
        response.status,
        200,
        'Certificate verification'
      );

      const data = extractData(response);

      if (
        data.verificationStatus !==
        'verified'
      ) {
        throw new Error(
          `Expected verified status, received ${data.verificationStatus}`
        );
      }

      if (!data.verifiedBy) {
        throw new Error(
          'verifiedBy was not recorded'
        );
      }

      if (!data.verifiedAt) {
        throw new Error(
          'verifiedAt was not recorded'
        );
      }
    }
  );

  // ----------------------------------------------------------
  // Public verification after approval
  // ----------------------------------------------------------

  await test(
    'Public verification marks verified certificate as valid',
    async () => {
      const response = await request(
        'GET',
        `/api/certificates/verify/${certificate1PublicId}`
      );

      assertStatus(
        response.status,
        200,
        'Public verification after approval'
      );

      const data = extractData(response);

      if (data.integrityVerified !== true) {
        throw new Error(
          'Certificate integrity verification failed'
        );
      }

      if (data.isValid !== true) {
        throw new Error(
          'Verified certificate should be publicly valid'
        );
      }

      if (
        data.verificationStatus !==
        'verified'
      ) {
        throw new Error(
          `Expected verified status, received ${data.verificationStatus}`
        );
      }
    }
  );

  // ----------------------------------------------------------
  // Admin certificate access
  // ----------------------------------------------------------

  await test(
    'Admin can view certificate details',
    async () => {
      if (!adminToken) {
        throw new Error(
          'Admin token unavailable'
        );
      }

      const response = await request(
        'GET',
        `/api/certificates/${certificate1Id}`,
        null,
        adminToken
      );

      assertStatus(
        response.status,
        200,
        'Admin certificate details'
      );

      const data = extractData(response);

      if (
        data._id?.toString() !==
        certificate1Id.toString()
      ) {
        throw new Error(
          'Admin received incorrect certificate'
        );
      }
    }
  );

  // ----------------------------------------------------------
  // Revocation
  // ----------------------------------------------------------

  await test(
    'Student cannot revoke certificate',
    async () => {
      const response = await request(
        'PUT',
        `/api/certificates/${certificate1Id}/revoke`,
        {
          revocationReason:
            'Unauthorized revocation attempt',
        },
        student1Token
      );

      assertStatus(
        response.status,
        403,
        'Student certificate revocation'
      );
    }
  );

  await test(
    'Institution 1 revokes verified certificate',
    async () => {
      const response = await request(
        'PUT',
        `/api/certificates/${certificate1Id}/revoke`,
        {
          revocationReason:
            'Phase 5 revocation lifecycle test',
        },
        institution1Token
      );

      assertStatus(
        response.status,
        200,
        'Certificate revocation'
      );

      const data = extractData(response);

      if (
        data.verificationStatus !==
        'revoked'
      ) {
        throw new Error(
          `Expected revoked status, received ${data.verificationStatus}`
        );
      }

      if (!data.revokedAt) {
        throw new Error(
          'revokedAt was not recorded'
        );
      }

      if (
        data.revocationReason !==
        'Phase 5 revocation lifecycle test'
      ) {
        throw new Error(
          'Revocation reason was not saved correctly'
        );
      }
    }
  );

  // ----------------------------------------------------------
  // Public verification after revocation
  // ----------------------------------------------------------

  await test(
    'Public verification marks revoked certificate as invalid',
    async () => {
      const response = await request(
        'GET',
        `/api/certificates/verify/${certificate1PublicId}`
      );

      assertStatus(
        response.status,
        200,
        'Public revoked certificate verification'
      );

      const data = extractData(response);

      if (data.integrityVerified !== true) {
        throw new Error(
          'Revoked certificate integrity should remain verifiable'
        );
      }

      if (data.isValid !== false) {
        throw new Error(
          'Revoked certificate must not be publicly valid'
        );
      }

      if (
        data.verificationStatus !==
        'revoked'
      ) {
        throw new Error(
          `Expected revoked status, received ${data.verificationStatus}`
        );
      }

      if (!data.revokedAt) {
        throw new Error(
          'Public response did not contain revokedAt'
        );
      }
    }
  );

  // ----------------------------------------------------------
  // Revoke again
  // ----------------------------------------------------------

  await test(
    'Already revoked certificate cannot be revoked again',
    async () => {
      const response = await request(
        'PUT',
        `/api/certificates/${certificate1Id}/revoke`,
        {
          revocationReason:
            'Second revocation attempt',
        },
        institution1Token
      );

      assertStatus(
        response.status,
        400,
        'Repeated certificate revocation'
      );
    }
  );

  // ----------------------------------------------------------
  // Review revoked certificate
  // ----------------------------------------------------------

  await test(
    'Revoked certificate cannot be reviewed',
    async () => {
      const response = await request(
        'PUT',
        `/api/certificates/${certificate1Id}/verify`,
        {
          verificationStatus: 'verified',
        },
        institution1Token
      );

      assertStatus(
        response.status,
        400,
        'Review revoked certificate'
      );
    }
  );

  // ----------------------------------------------------------
  // Summary
  // ----------------------------------------------------------

  console.log('\n==============================================');
  console.log(' PHASE 5.2 CERTIFICATE TEST SUMMARY');
  console.log('==============================================');
  console.log(`Total tests : ${testNumber}`);
  console.log(`Passed      : ${passed}`);
  console.log(`Failed      : ${failed}`);
  console.log('==============================================\n');

  if (failed === 0) {
    console.log(
      '🎉 ALL PHASE 5.2 CERTIFICATE API TESTS PASSED SUCCESSFULLY!'
    );
    console.log(
      'Certificate issuance, integrity, verification, RBAC, public validation, and revocation are working.'
    );
  } else {
    console.log(
      '⚠️ PHASE 5.2 CERTIFICATE TESTS HAVE FAILURES.'
    );
    console.log(
      'Fix the failing tests before moving to Phase 5.3.'
    );
    process.exitCode = 1;
  }
}

// ------------------------------------------------------------
// Run
// ------------------------------------------------------------

runTests()
  .catch((error) => {
    console.error('\n💥 TEST RUNNER ERROR');
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    try {
      if (mongoose.connection.readyState !== 0) {
        await mongoose.connection.close();
      }
    } catch {
      // Ignore cleanup errors.
    }
  });