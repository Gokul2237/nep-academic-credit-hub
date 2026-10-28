const http = require('http');
const mongoose = require('mongoose');
const xlsx = require('xlsx');
const app = require('./server.js');
const { User, ROLES } = require('./models/User');
const Institution = require('./models/Institution');
const { Course } = require('./models/Course');
const { AcademicCredit } = require('./models/AcademicCredit');
const { SemesterResult } = require('./models/SemesterResult');
const { ResultImportBatch } = require('./models/ResultImportBatch');
const AuditLog = require('./models/AuditLog');

let serverInstance = null;
const TEST_PORT = process.env.TEST_PORT ? parseInt(process.env.TEST_PORT, 10) : 5000;

const makeRequest = (options, postData = null, isMultipart = false) => {
  return new Promise((resolve, reject) => {
    const finalOptions = { ...options, port: TEST_PORT };
    const req = http.request(finalOptions, (res) => {
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
      if (isMultipart || Buffer.isBuffer(postData)) {
        req.write(postData);
      } else {
        req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
      }
    }
    req.end();
  });
};

// Helper: build multipart body with single file and fields
function buildMultipartFormData(fields, fileFieldName, fileName, fileBuffer) {
  const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
  const parts = [];

  for (const [key, val] of Object.entries(fields)) {
    parts.push(
      `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="${key}"\r\n\r\n` +
      `${val}\r\n`
    );
  }

  parts.push(
    `--${boundary}\r\n` +
    `Content-Disposition: form-data; name="${fileFieldName}"; filename="${fileName}"\r\n` +
    `Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet\r\n\r\n`
  );

  const headerBuffer = Buffer.from(parts.join(''), 'utf-8');
  const footerBuffer = Buffer.from(`\r\n--${boundary}--\r\n`, 'utf-8');

  const fullBuffer = Buffer.concat([headerBuffer, fileBuffer, footerBuffer]);
  const contentType = `multipart/form-data; boundary=${boundary}`;

  return { buffer: fullBuffer, contentType };
}

let passedTests = 0;
let totalTests = 0;

function assert(condition, testName, failureDetails = '') {
  totalTests++;
  if (condition) {
    console.log(`   ✅ PASS: ${testName}`);
    passedTests++;
  } else {
    console.error(`   ❌ FAIL: ${testName} - ${failureDetails}`);
    throw new Error(`Assertion failed: ${testName} - ${failureDetails}`);
  }
}

async function runTestSuite() {
  console.log('================================================================');
  console.log('🧪 SEMESTER RESULTS IMPORT & PROGRESSION AUTOMATED TEST SUITE');
  console.log('================================================================\n');

  // Start test server if not listening
  await new Promise((resolve) => {
    serverInstance = app.listen(TEST_PORT, () => {
      console.log(`🚀 Test server listening on port ${TEST_PORT}`);
      resolve();
    });
    serverInstance.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        serverInstance = null;
        resolve();
      }
    });
  });

  while (mongoose.connection.readyState !== 1) {
    await new Promise((r) => setTimeout(r, 200));
  }

  const testId = Date.now().toString().slice(-4);

  try {
    // 1. Setup Test Institutions & Personas
    console.log('1️⃣  Setting up test institutions & accounts...');
    let instA = await Institution.findOne({ code: 'BIT001' });
    if (!instA) {
      instA = await Institution.create({
        name: 'Bannari Amman Institute of Technology',
        code: 'BIT001',
        type: 'AUTONOMOUS_COLLEGE',
        contactEmail: 'admin@bit.edu',
        verificationStatus: 'VERIFIED',
      });
    }

    let instB = await Institution.findOne({ code: 'KIT002' });
    if (!instB) {
      instB = await Institution.create({
        name: 'Kongu Engineering College',
        code: 'KIT002',
        type: 'AUTONOMOUS_COLLEGE',
        contactEmail: 'admin@kit.edu',
        verificationStatus: 'VERIFIED',
      });
    }

    // Create Institution A User
    const instAEmail = `dean_inst_a_${testId}@bit.edu`;
    const regInstA = await makeRequest(
      {
        hostname: 'localhost',
        port: 5000,
        path: '/api/auth/register',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      {
        name: 'Dean Inst A',
        email: instAEmail,
        password: 'Password@123',
        role: 'institution',
        institutionCode: instA.code,
        institutionName: instA.name,
      }
    );
    assert(regInstA.status === 201, 'Institution A Registration');
    const instAToken = regInstA.body.data.token;
    const instAId = regInstA.body.data.user.institutionId;

    // Create Student 1 (Enrolled in Inst A)
    const stu1AbcId = `ABC-TEST1-${testId}`;
    const stu1Email = `stu1_${testId}@bit.edu`;
    const regStu1 = await makeRequest(
      {
        hostname: 'localhost',
        port: 5000,
        path: '/api/auth/register',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      {
        name: 'Aarav Test Student',
        email: stu1Email,
        password: 'Password@123',
        role: 'student',
        studentId: stu1AbcId,
        institutionId: instAId,
      }
    );
    assert(regStu1.status === 201, 'Student 1 (Inst A) Registration');
    const stu1Token = regStu1.body.data.token;
    const stu1Id = regStu1.body.data.user._id;

    // Create Student 2 (Enrolled in Inst A - will fail course)
    const stu2AbcId = `ABC-TEST2-${testId}`;
    const stu2Email = `stu2_${testId}@bit.edu`;
    const regStu2 = await makeRequest(
      {
        hostname: 'localhost',
        port: 5000,
        path: '/api/auth/register',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      {
        name: 'Bhavya Test Student',
        email: stu2Email,
        password: 'Password@123',
        role: 'student',
        studentId: stu2AbcId,
        institutionId: instAId,
      }
    );
    assert(regStu2.status === 201, 'Student 2 (Inst A) Registration');
    const stu2Id = regStu2.body.data.user._id;

    // Create Student 3 (Enrolled in Inst B - Cross Institution Student)
    const stu3AbcId = `ABC-TEST3-${testId}`;
    const stu3Email = `stu3_${testId}@kit.edu`;
    const regStu3 = await makeRequest(
      {
        hostname: 'localhost',
        port: 5000,
        path: '/api/auth/register',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      {
        name: 'Chetan External Student',
        email: stu3Email,
        password: 'Password@123',
        role: 'student',
        studentId: stu3AbcId,
        institutionId: instB._id,
      }
    );
    assert(regStu3.status === 201, 'Student 3 (Inst B - Cross Institution) Registration');

    // Create Course in Inst A
    const courseCodeA = `CS${testId}`;
    let testCourseA = await Course.findOne({ courseCode: courseCodeA, institutionId: instAId });
    if (!testCourseA) {
      testCourseA = await Course.create({
        courseCode: courseCodeA,
        courseName: 'Algorithms & Data Foundations',
        credits: 4,
        semester: 1,
        department: 'Computer Science',
        institutionId: instAId,
        isActive: true,
      });
    }
    assert(testCourseA && testCourseA.credits === 4, 'Authoritative Course A in Inst A created with credits = 4');

    const courseCodeB = `CSB${testId}`;
    let testCourseB = await Course.findOne({ courseCode: courseCodeB, institutionId: instAId });
    if (!testCourseB) {
      testCourseB = await Course.create({
        courseCode: courseCodeB,
        courseName: 'Discrete Structures',
        credits: 3,
        semester: 1,
        department: 'Computer Science',
        institutionId: instAId,
        isActive: true,
      });
    }
    assert(testCourseB && testCourseB.credits === 3, 'Authoritative Course B in Inst A created with credits = 3');

    // Verify initial currentSemester is 1
    const stu1Initial = await User.findById(stu1Id);
    assert(stu1Initial.currentSemester === 1, 'Student 1 initial currentSemester is 1');
    const stu2Initial = await User.findById(stu2Id);
    assert(stu2Initial.currentSemester === 1, 'Student 2 initial currentSemester is 1');

    // 2. Download Sample Template
    console.log('\n2️⃣  Testing Sample Excel Template Download...');
    const templateRes = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/institution/results/template',
      method: 'GET',
      headers: { Authorization: `Bearer ${instAToken}` },
    });
    assert(templateRes.status === 200, 'Template download returns 200');
    assert(
      templateRes.headers['content-type']?.includes('spreadsheetml'),
      'Template content-type is xlsx'
    );

    // 3. Construct In-Memory Test XLSX Worksheet
    console.log('\n3️⃣  Building in-memory test spreadsheet with multi-scenario rows...');
    const testRows = [
      // Row 1: Valid student 1 + Valid course + Pass (85, A+) -> Should be Valid, Earn 4 credits, Qualify to advance
      {
        'ABC ID': stu1AbcId,
        'Student Name': 'Aarav Test Student',
        'Course Code': courseCodeA,
        'Course Name': testCourseA.courseName,
        Marks: 85,
        Grade: 'A+',
      },
      // Row 2: Valid student 2 + Valid course + Fail (32, F) -> Should be Valid row format, FAIL status, Earn 0 credits, NO advance
      {
        'ABC ID': stu2AbcId,
        'Student Name': 'Bhavya Test Student',
        'Course Code': courseCodeA,
        'Course Name': testCourseA.courseName,
        Marks: 32,
        Grade: 'F',
      },
      // Row 3: Unknown ABC ID -> Should be Rejected (never auto-create student)
      {
        'ABC ID': `UNKNOWN-ABC-${testId}`,
        'Student Name': 'Ghost Student',
        'Course Code': courseCodeA,
        'Course Name': testCourseA.courseName,
        Marks: 75,
        Grade: 'A',
      },
      // Row 4: Cross-institution ABC ID -> Should be Rejected (tenant isolation)
      {
        'ABC ID': stu3AbcId,
        'Student Name': 'Chetan External Student',
        'Course Code': courseCodeA,
        'Course Name': testCourseA.courseName,
        Marks: 90,
        Grade: 'O',
      },
      // Row 5: Unknown Course Code -> Should be Rejected
      {
        'ABC ID': stu1AbcId,
        'Student Name': 'Aarav Test Student',
        'Course Code': 'NONEXISTENT999',
        'Course Name': 'Fake Course',
        Marks: 70,
        Grade: 'B+',
      },
      // Row 6: Invalid Marks -> Should be Rejected
      {
        'ABC ID': stu2AbcId,
        'Student Name': 'Bhavya Test Student',
        'Course Code': courseCodeB,
        'Course Name': testCourseB.courseName,
        Marks: 150,
        Grade: 'A',
      },
      // Row 7: Duplicate row in file for Student 1 -> Should be Rejected as duplicate
      {
        'ABC ID': stu1AbcId,
        'Student Name': 'Aarav Test Student',
        'Course Code': courseCodeA,
        'Course Name': testCourseA.courseName,
        Marks: 88,
        Grade: 'A+',
      },
    ];

    const wb = xlsx.utils.book_new();
    const ws = xlsx.utils.json_to_sheet(testRows);
    xlsx.utils.book_append_sheet(wb, ws, 'Results');
    const xlsxBuffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });

    // 4. Test Preview Endpoint
    console.log('\n4️⃣  Testing Excel Preview Endpoint (POST /api/institution/results/preview)...');
    const multipart = buildMultipartFormData(
      { academicYear: '2024-25', semester: 1 },
      'file',
      'test_results.xlsx',
      xlsxBuffer
    );

    const previewRes = await makeRequest(
      {
        hostname: 'localhost',
        port: 5000,
        path: '/api/institution/results/preview',
        method: 'POST',
        headers: {
          Authorization: `Bearer ${instAToken}`,
          'Content-Type': multipart.contentType,
          'Content-Length': multipart.buffer.length,
        },
      },
      multipart.buffer,
      true
    );

    assert(previewRes.status === 200, 'Preview endpoint returns 200', JSON.stringify(previewRes.body));
    const previewData = previewRes.body.data;
    assert(previewData.counts.totalRows === 7, `Total rows is 7 (got ${previewData.counts.totalRows})`);
    assert(previewData.counts.validRows === 2, `Valid rows is 2 (got ${previewData.counts.validRows})`);
    assert(previewData.counts.invalidRows === 5, `Invalid rows is 5 (got ${previewData.counts.invalidRows})`);
    assert(previewData.counts.duplicateRows === 1, `Duplicate in file is 1 (got ${previewData.counts.duplicateRows})`);
    assert(previewData.counts.totalEligibleCredits === 4, `Eligible credits is 4 (Row 1 pass = 4, Row 2 fail = 0)`);

    // Verify database was NOT modified during preview
    const creditsAfterPreview = await AcademicCredit.countDocuments({ studentId: stu1Id });
    assert(creditsAfterPreview === 0, 'No credits awarded during preview phase');
    const resultsAfterPreview = await SemesterResult.countDocuments({ studentId: stu1Id });
    assert(resultsAfterPreview === 0, 'No semester results saved during preview phase');

    const batchId = previewData.batchId;
    assert(batchId && batchId.startsWith('BATCH-'), `Batch ID generated: ${batchId}`);

    // 5. Test Confirmation Endpoint
    console.log('\n5️⃣  Testing Confirmation Endpoint (POST /api/institution/results/confirm)...');
    const confirmRes = await makeRequest(
      {
        hostname: 'localhost',
        port: 5000,
        path: '/api/institution/results/confirm',
        method: 'POST',
        headers: {
          Authorization: `Bearer ${instAToken}`,
          'Content-Type': 'application/json',
        },
      },
      { batchId }
    );

    assert(confirmRes.status === 200, 'Confirmation returns 200', JSON.stringify(confirmRes.body));
    const confirmData = confirmRes.body.data;
    assert(confirmData.processedRows === 2, `Processed 2 valid rows (got ${confirmData.processedRows})`);
    assert(confirmData.creditsAwarded === 1, `1 credit record awarded (passing student) (got ${confirmData.creditsAwarded})`);
    assert(confirmData.creditPointsTotal === 4, `Credit points total is 4 (got ${confirmData.creditPointsTotal})`);
    assert(confirmData.studentsAdvanced === 1, `1 student advanced (got ${confirmData.studentsAdvanced})`);

    // 6. Verify Database State & Progression
    console.log('\n6️⃣  Verifying Database Integrity, Cryptographic Hash & Semester Progression...');

    // Student 1 (Passed): should have SemesterResult + AcademicCredit + Advanced to Semester 2
    const stu1Result = await SemesterResult.findOne({ studentId: stu1Id, courseId: testCourseA._id });
    assert(stu1Result !== null, 'Student 1 SemesterResult created');
    assert(stu1Result.grade === 'A+' && stu1Result.resultStatus === 'PASS', 'Student 1 grade is A+, status PASS');
    assert(stu1Result.creditsEarned === 4, 'Student 1 credits earned is 4 (authoritative course credit)');

    const stu1Credit = await AcademicCredit.findOne({ studentId: stu1Id, courseId: testCourseA._id });
    assert(stu1Credit !== null, 'Student 1 AcademicCredit created');
    assert(stu1Credit.credits === 4, 'Student 1 AcademicCredit value is 4');
    assert(stu1Credit.integrityHash && stu1Credit.integrityHash.length === 64, 'Credit sealed with 64-char SHA-256 hash');

    const stu1Updated = await User.findById(stu1Id);
    assert(stu1Updated.currentSemester === 2, `Student 1 advanced to Semester 2 (currentSemester = ${stu1Updated.currentSemester})`);

    // Student 2 (Failed): should have SemesterResult with FAIL, 0 credits, NO AcademicCredit, REMAINS in Semester 1
    const stu2Result = await SemesterResult.findOne({ studentId: stu2Id, courseId: testCourseA._id });
    assert(stu2Result !== null, 'Student 2 SemesterResult created');
    assert(stu2Result.grade === 'F' && stu2Result.resultStatus === 'FAIL', 'Student 2 grade is F, status FAIL');
    assert(stu2Result.creditsEarned === 0, 'Student 2 earned 0 credits');

    const stu2Credit = await AcademicCredit.findOne({ studentId: stu2Id, courseId: testCourseA._id });
    assert(stu2Credit === null, 'Failed student earned 0 academic credits (no AcademicCredit record)');

    const stu2Updated = await User.findById(stu2Id);
    assert(stu2Updated.currentSemester === 1, `Student 2 remains in Semester 1 (currentSemester = ${stu2Updated.currentSemester})`);

    // 7. Test Idempotency & Duplicate Prevention
    console.log('\n7️⃣  Testing Idempotency (Re-uploading / Re-confirming)...');
    // Re-previewing the same file
    const repreviewRes = await makeRequest(
      {
        hostname: 'localhost',
        port: 5000,
        path: '/api/institution/results/preview',
        method: 'POST',
        headers: {
          Authorization: `Bearer ${instAToken}`,
          'Content-Type': multipart.contentType,
          'Content-Length': multipart.buffer.length,
        },
      },
      multipart.buffer,
      true
    );
    assert(repreviewRes.status === 200, 'Re-preview returns 200');
    assert(
      repreviewRes.body.data.counts.previouslyProcessedRows === 2,
      `Previously recorded count is 2 (got ${repreviewRes.body.data.counts.previouslyProcessedRows})`
    );
    assert(
      repreviewRes.body.data.counts.validRows === 0,
      'Valid unprocessed rows is 0 on duplicate upload'
    );

    // Re-confirming same batch should reject
    const reconfirmRes = await makeRequest(
      {
        hostname: 'localhost',
        port: 5000,
        path: '/api/institution/results/confirm',
        method: 'POST',
        headers: {
          Authorization: `Bearer ${instAToken}`,
          'Content-Type': 'application/json',
        },
      },
      { batchId }
    );
    assert(reconfirmRes.status === 400, 'Re-confirming already processed batch is rejected with 400');

    // Verify credits count did not double
    const totalCreditsForStu1 = await AcademicCredit.countDocuments({ studentId: stu1Id });
    assert(totalCreditsForStu1 === 1, 'Idempotency verified: duplicate credit was NOT created');

    // 7b. Test Partial Overlap: 1 record already exists, 2 records are brand new
    console.log('\n7️⃣b Testing Partial Overlap (1 already exists, 2 are brand new)...');
    const partialOverlapRows = [
      { 'ABC ID': stu1AbcId, 'Course Code': testCourseA.courseCode, Marks: 90, Grade: 'O' }, // Already exists!
      { 'ABC ID': stu1AbcId, 'Course Code': testCourseB.courseCode, Marks: 82, Grade: 'A+' }, // Brand new (3 credits)!
      { 'ABC ID': stu2AbcId, 'Course Code': testCourseB.courseCode, Marks: 78, Grade: 'A' },  // Brand new (3 credits)!
    ];
    const wsPartial = xlsx.utils.json_to_sheet(partialOverlapRows);
    const wbPartial = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wbPartial, wsPartial, 'Results Template');
    const partialBuffer = xlsx.write(wbPartial, { type: 'buffer', bookType: 'xlsx' });
    const partialMultipart = buildMultipartFormData(
      { academicYear: '2024-25', semester: '1' }, // Cross-year test
      'file',
      'partial_overlap.xlsx',
      partialBuffer
    );

    const partialPreviewRes = await makeRequest(
      {
        hostname: 'localhost',
        port: 5000,
        path: '/api/institution/results/preview',
        method: 'POST',
        headers: {
          Authorization: `Bearer ${instAToken}`,
          'Content-Type': partialMultipart.contentType,
          'Content-Length': partialMultipart.buffer.length,
        },
      },
      partialMultipart.buffer,
      true
    );

    assert(partialPreviewRes.status === 200, 'Partial preview returns 200');
    const pData = partialPreviewRes.body.data;
    assert(pData.counts.totalRows === 3, `Total rows is 3 (got ${pData.counts.totalRows})`);
    assert(pData.counts.validRows === 2, `Valid rows is 2 (got ${pData.counts.validRows})`);
    assert(pData.counts.previouslyProcessedRows === 1, `Previously recorded rows is 1 (got ${pData.counts.previouslyProcessedRows})`);
    assert(pData.counts.totalEligibleCredits === 6, `Eligible credits is 6 for the 2 new courses (got ${pData.counts.totalEligibleCredits})`);

    const dupItem = pData.items.find((i) => i.courseCode === testCourseA.courseCode);
    assert(dupItem.isAlreadyProcessed === true, 'Existing item flagged as isAlreadyProcessed = true');
    assert(dupItem.eligibleCredits === 0, 'Existing item eligibleCredits is 0');
    assert(dupItem.alreadyExistsReason && dupItem.alreadyExistsReason.includes('Credits already awarded'), 'Existing item has clear alreadyExistsReason');

    // Confirm the partial overlap batch
    const partialConfirmRes = await makeRequest(
      {
        hostname: 'localhost',
        port: 5000,
        path: '/api/institution/results/confirm',
        method: 'POST',
        headers: {
          Authorization: `Bearer ${instAToken}`,
          'Content-Type': 'application/json',
        },
      },
      { batchId: pData.batchId }
    );

    assert(partialConfirmRes.status === 200, 'Partial confirm returns 200');
    const pcData = partialConfirmRes.body.data;
    assert(pcData.processedRows === 2, `Processed exactly 2 valid rows (got ${pcData.processedRows})`);
    assert(pcData.creditsAwarded === 2, `Awarded exactly 2 credits (got ${pcData.creditsAwarded})`);
    assert(pcData.creditPointsTotal === 6, `Awarded 6 credit points total (got ${pcData.creditPointsTotal})`);

    // Verify Student 1 has Course A + Course B (2 credits), NO duplicate Course A!
    const stu1CreditsAfter = await AcademicCredit.find({ studentId: stu1Id });
    assert(stu1CreditsAfter.length === 2, `Student 1 has exactly 2 credits (got ${stu1CreditsAfter.length})`);
    const courseACountForStu1 = await AcademicCredit.countDocuments({ studentId: stu1Id, courseId: testCourseA._id });
    assert(courseACountForStu1 === 1, `Student 1 still has exactly 1 credit for Course A (no duplicate!)`);

    // 8. Test Audited Correction
    console.log('\n8️⃣  Testing Audited Correction Policy (PUT /api/institution/results/:id/correct)...');
    const correctRes = await makeRequest(
      {
        hostname: 'localhost',
        port: 5000,
        path: `/api/institution/results/${stu2Result._id}/correct`,
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${instAToken}`,
          'Content-Type': 'application/json',
        },
      },
      {
        marks: 68,
        grade: 'B+',
        reason: 'Re-evaluation passed by Institutional Academic Examination Board',
      }
    );
    assert(correctRes.status === 200, 'Audited correction returns 200');
    assert(correctRes.body.data.isCorrected === true, 'isCorrected flag set to true');
    assert(correctRes.body.data.resultStatus === 'PASS', 'Status updated to PASS');
    assert(correctRes.body.data.creditsEarned === 4, 'Credits updated to 4');
    assert(correctRes.body.data.correctionHistory.length === 1, 'Correction history logged 1 revision');

    // Verify AcademicCredit was awarded after correction
    const stu2CreditAfterCorrection = await AcademicCredit.findOne({ studentId: stu2Id, courseId: testCourseA._id });
    assert(stu2CreditAfterCorrection !== null, 'AcademicCredit awarded after passing correction');
    assert(stu2CreditAfterCorrection.credits === 4, 'Awarded credits value is 4');

    // 9. Test Student Own Semester Results Endpoint
    console.log('\n9️⃣  Testing Student Own Semester Results (GET /api/credits/semester-results)...');
    const stuOwnRes = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/credits/semester-results',
      method: 'GET',
      headers: { Authorization: `Bearer ${stu1Token}` },
    });
    assert(stuOwnRes.status === 200, 'Student results endpoint returns 200');
    assert(stuOwnRes.body.data.currentSemester === 2, 'Student currentSemester reports 2');
    assert(stuOwnRes.body.data.results.length === 2, 'Student results has 2 records (Course A and Course B)');
    assert(stuOwnRes.body.data.groupedBySemester['Semester 1'].totalCreditsEarned === 7, 'Semester 1 credits earned is 7 (4 from Course A + 3 from Course B)');

    // 10. Test Security & RBAC Scoping
    console.log('\n🔟 Testing RBAC & Unauthorized Access Protection...');
    // Student token attempting to upload results
    const unauthRes = await makeRequest(
      {
        hostname: 'localhost',
        port: 5000,
        path: '/api/institution/results/preview',
        method: 'POST',
        headers: {
          Authorization: `Bearer ${stu1Token}`,
          'Content-Type': multipart.contentType,
          'Content-Length': multipart.buffer.length,
        },
      },
      multipart.buffer,
      true
    );
    assert(unauthRes.status === 403, 'Student role forbidden from uploading results (403)');

    // Unauthenticated request
    const noTokenRes = await makeRequest({
      hostname: 'localhost',
      port: 5000,
      path: '/api/institution/results/batches',
      method: 'GET',
    });
    assert(noTokenRes.status === 401, 'Unauthenticated request rejected with 401');

    console.log('\n================================================================');
    console.log(`🎉 ALL ${passedTests}/${totalTests} TESTS PASSED SUCCESSFULLY!`);
    console.log('================================================================\n');

    return { passedTests, totalTests, serverInstance };
  } catch (err) {
    console.error('\n❌ Test Suite Failed:', err);
    throw err;
  } finally {
    // Automated teardown: Clean up test artifacts created with this testId
    try {
      const db = mongoose.connection.db;
      if (db) {
        const testCourses = await db.collection('courses').find({ courseCode: { $in: [`CS${testId}`, `CSB${testId}`] } }).toArray();
        const testCourseIds = testCourses.map(c => c._id);
        if (testCourseIds.length > 0) {
          await db.collection('academiccredits').deleteMany({ courseId: { $in: testCourseIds } });
          await db.collection('semesterresults').deleteMany({ courseId: { $in: testCourseIds } });
          await db.collection('courses').deleteMany({ _id: { $in: testCourseIds } });
        }
        const testUserDocs = await db.collection('users').find({
          $or: [
            { email: { $regex: new RegExp(testId) } },
            { studentId: { $regex: new RegExp(testId) } }
          ]
        }).toArray();
        const testUserIds = testUserDocs.map(u => u._id);
        if (testUserIds.length > 0) {
          await db.collection('resultimportbatches').deleteMany({ uploadedBy: { $in: testUserIds } });
          await db.collection('auditlogs').deleteMany({
            $or: [
              { userId: { $in: testUserIds } },
              { performedBy: { $in: testUserIds } },
              { 'details.studentAbcId': { $regex: new RegExp(testId) } },
              { 'details.batchId': { $regex: new RegExp(testId) } }
            ]
          });
          await db.collection('users').deleteMany({ _id: { $in: testUserIds } });
        }
        console.log(`   🧹 Cleaned up temporary test artifacts for testId: ${testId}`);
      }
    } catch (cleanErr) {
      console.warn('⚠️ Teardown cleanup error:', cleanErr.message);
    }
    if (serverInstance && serverInstance.close) {
      serverInstance.close();
    }
  }
}

if (require.main === module) {
  runTestSuite()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = runTestSuite;
