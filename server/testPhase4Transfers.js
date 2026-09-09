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

async function runPhase4Tests() {
  console.log('🧪 Starting Phase 4 Credit Transfer & Multi-Tenant Verification Suite...\n');
  await new Promise((r) => setTimeout(r, 1200));

  const testId = Date.now().toString().slice(-4);
  const student1Email = `student1_p4_${testId}@test.ac.in`;
  const student2Email = `student2_p4_${testId}@test.ac.in`;
  const inst1Email = `dean_inst1_${testId}@iitb.ac.in`;
  const inst2Email = `dean_inst2_${testId}@nitk.ac.in`;
  const inst3Email = `dean_inst3_${testId}@bits.ac.in`;
  const password = 'Password@123';

  let student1Token = null, student1Id = null;
  let student2Token = null, student2Id = null;
  let inst1Token = null, inst1Id = null;
  let inst2Token = null, inst2Id = null;
  let inst3Token = null, inst3Id = null;
  let adminToken = null;

  let course1Id = null, credit1Id = null;
  let course2Id = null, credit2Id = null;
  let transfer1Id = null, transfer2Id = null;

  try {
    console.log('0️⃣  Setting up test personas (Inst 1, Inst 2, Inst 3, Student 1, Student 2, Admin)...');

    // Inst 1 (IITB)
    const i1 = await makeRequest(
      { hostname: 'localhost', port: 5000, path: '/api/auth/register', method: 'POST', headers: { 'Content-Type': 'application/json' } },
      { name: 'IIT Bombay Node', email: inst1Email, password, role: 'institution', institutionName: `IIT Bombay ${testId}`, institutionCode: `IITB_${testId}` }
    );
    inst1Token = i1.body.data.token;
    inst1Id = i1.body.data.user.institutionId;

    // Inst 2 (NITK)
    const i2 = await makeRequest(
      { hostname: 'localhost', port: 5000, path: '/api/auth/register', method: 'POST', headers: { 'Content-Type': 'application/json' } },
      { name: 'NIT Surathkal Node', email: inst2Email, password, role: 'institution', institutionName: `NIT Karnataka ${testId}`, institutionCode: `NITK_${testId}` }
    );
    inst2Token = i2.body.data.token;
    inst2Id = i2.body.data.user.institutionId;

    // Inst 3 (BITS)
    const i3 = await makeRequest(
      { hostname: 'localhost', port: 5000, path: '/api/auth/register', method: 'POST', headers: { 'Content-Type': 'application/json' } },
      { name: 'BITS Pilani Node', email: inst3Email, password, role: 'institution', institutionName: `BITS Pilani ${testId}`, institutionCode: `BITS_${testId}` }
    );
    inst3Token = i3.body.data.token;
    inst3Id = i3.body.data.user.institutionId;

    // Student 1 (belongs to Inst 1)
    const s1 = await makeRequest(
      { hostname: 'localhost', port: 5000, path: '/api/auth/register', method: 'POST', headers: { 'Content-Type': 'application/json' } },
      { name: `Karan Verma ${testId}`, email: student1Email, password, role: 'student', studentId: `ABC-P4-1-${testId}`, institutionId: inst1Id }
    );
    student1Token = s1.body.data.token;
    student1Id = s1.body.data.user._id;

    // Student 2 (belongs to Inst 2)
    const s2 = await makeRequest(
      { hostname: 'localhost', port: 5000, path: '/api/auth/register', method: 'POST', headers: { 'Content-Type': 'application/json' } },
      { name: `Priya Nair ${testId}`, email: student2Email, password, role: 'student', studentId: `ABC-P4-2-${testId}`, institutionId: inst2Id }
    );
    student2Token = s2.body.data.token;
    student2Id = s2.body.data.user._id;

    // Admin Login
    const adm = await makeRequest(
      { hostname: 'localhost', port: 5000, path: '/api/auth/login', method: 'POST', headers: { 'Content-Type': 'application/json' } },
      { email: 'admin@nep.gov.in', password: 'Admin@123456' }
    );
    adminToken = adm.body.data.token;

    // Create Course 1 by Inst 1
    const c1 = await makeRequest(
      { hostname: 'localhost', port: 5000, path: '/api/courses', method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${inst1Token}` } },
      { courseCode: `CS401_${testId}`, courseName: 'Operating Systems', credits: 4, department: 'CSE', semester: 4 }
    );
    course1Id = c1.body.data._id;

    // Award Credit 1 to Student 1 by Inst 1
    const cr1 = await makeRequest(
      { hostname: 'localhost', port: 5000, path: '/api/credits', method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${inst1Token}` } },
      { studentEmail: student1Email, courseId: course1Id, credits: 4, grade: 'A+', semester: 4, academicYear: '2025-26', verificationStatus: 'verified' }
    );
    credit1Id = cr1.body.data._id;

    // Create Course 2 & Award Credit 2 to Student 2 by Inst 2
    const c2 = await makeRequest(
      { hostname: 'localhost', port: 5000, path: '/api/courses', method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${inst2Token}` } },
      { courseCode: `EC301_${testId}`, courseName: 'Digital Signal Processing', credits: 3, department: 'ECE', semester: 5 }
    );
    course2Id = c2.body.data._id;

    const cr2 = await makeRequest(
      { hostname: 'localhost', port: 5000, path: '/api/credits', method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${inst2Token}` } },
      { studentEmail: student2Email, courseId: course2Id, credits: 3, grade: 'O', semester: 5, academicYear: '2025-26', verificationStatus: 'verified' }
    );
    credit2Id = cr2.body.data._id;

    console.log('   ✓ Test environment setup successfully.\n');

    // 1. Student 1 creates valid transfer request to Inst 2
    console.log('1️⃣  Testing Valid Transfer Request Creation (Student 1 -> Inst 2)...');
    const tr1 = await makeRequest(
      { hostname: 'localhost', port: 5000, path: '/api/transfers', method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${student1Token}` } },
      { destinationInstitutionId: inst2Id, creditIds: [credit1Id], reason: 'Relocating to NIT Karnataka for integrated program' }
    );
    console.log(`   Status: ${tr1.status} (Expected: 201)`);
    if (tr1.status !== 201) throw new Error(`Transfer creation failed: ${JSON.stringify(tr1.body)}`);
    transfer1Id = tr1.body.data._id;
    console.log(`   Transfer Request ID: ${transfer1Id}, Status: ${tr1.body.data.status}`);

    // 2. Reject transfer request from invalid/non-student account
    console.log('\n2️⃣  Testing Non-Student Account Transfer Request Rejection...');
    const invalidStudTr = await makeRequest(
      { hostname: 'localhost', port: 5000, path: '/api/transfers', method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${inst1Token}` } },
      { destinationInstitutionId: inst2Id, creditIds: [credit1Id] }
    );
    console.log(`   Status: ${invalidStudTr.status} (Expected: 403)`);
    if (invalidStudTr.status !== 403) throw new Error('Non-student account was allowed to request transfer');

    // 3. Reject transfer request with invalid credit ID format
    console.log('\n3️⃣  Testing Invalid Credit ID Format Rejection...');
    const invCredTr = await makeRequest(
      { hostname: 'localhost', port: 5000, path: '/api/transfers', method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${student1Token}` } },
      { destinationInstitutionId: inst2Id, creditIds: ['invalid-id-123'] }
    );
    console.log(`   Status: ${invCredTr.status} (Expected: 400)`);
    if (invCredTr.status !== 400) throw new Error('Invalid credit ID format was not rejected');

    // 4. Reject transfer request for credit belonging to another student
    console.log('\n4️⃣  Testing Transfer Request for Credit Belonging to Another Student (Expected 403)...');
    const stolenCredTr = await makeRequest(
      { hostname: 'localhost', port: 5000, path: '/api/transfers', method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${student1Token}` } },
      { destinationInstitutionId: inst2Id, creditIds: [credit2Id] } // Credit 2 belongs to Student 2!
    );
    console.log(`   Status: ${stolenCredTr.status} (Expected: 403)`);
    if (stolenCredTr.status !== 403) throw new Error('Student was able to initiate transfer for another student credit');

    // 5. Reject transfer request with invalid destination institution ID
    console.log('\n5️⃣  Testing Invalid Destination Institution ID Rejection (Expected 400 or 404)...');
    const invInstTr = await makeRequest(
      { hostname: 'localhost', port: 5000, path: '/api/transfers', method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${student1Token}` } },
      { destinationInstitutionId: inst1Id, creditIds: [credit1Id] } // Destination equals source institution!
    );
    console.log(`   Status: ${invInstTr.status} (Expected: 400)`);
    if (invInstTr.status !== 400) throw new Error('Same destination as source institution was not rejected');

    // 6. Cross-institution unauthorized transfer evaluation rejection
    console.log('\n6️⃣  Testing Unauthorized Institution Reviewing Transfer (Inst 1 attempting to review transfer to Inst 2 - Expected 403)...');
    const unauthReview = await makeRequest(
      { hostname: 'localhost', port: 5000, path: `/api/transfers/${transfer1Id}/review`, method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${inst1Token}` } },
      { status: 'APPROVED', remarks: 'Inst 1 trying to approve' }
    );
    console.log(`   Status: ${unauthReview.status} (Expected: 403)`);
    if (unauthReview.status !== 403) throw new Error('Source institution was able to review transfer directed to destination');

    // 7. Destination Institution 2 can view incoming transfer request
    console.log('\n7️⃣  Testing Destination Institution (Inst 2) Viewing Incoming Transfer Request...');
    const inst2Incoming = await makeRequest(
      { hostname: 'localhost', port: 5000, path: '/api/transfers', method: 'GET', headers: { Authorization: `Bearer ${inst2Token}` } }
    );
    console.log(`   Status: ${inst2Incoming.status} (Expected: 200)`);
    console.log(`   Incoming count: ${inst2Incoming.body.data.length}`);
    const foundTr1 = inst2Incoming.body.data.some((t) => t._id === transfer1Id);
    if (!foundTr1) throw new Error('Destination institution could not find incoming transfer request');

    // 8. Unrelated Institution 3 cannot view Student 1\'s transfer request
    console.log('\n8️⃣  Testing Unrelated Institution (Inst 3) Access to Transfer Request (Expected 403)...');
    const inst3Single = await makeRequest(
      { hostname: 'localhost', port: 5000, path: `/api/transfers/${transfer1Id}`, method: 'GET', headers: { Authorization: `Bearer ${inst3Token}` } }
    );
    console.log(`   Status: ${inst3Single.status} (Expected: 403)`);
    if (inst3Single.status !== 403) throw new Error('Unrelated institution was allowed to access transfer details');

    // 9. Destination Institution 2 approves Student 1\'s transfer request
    console.log('\n9️⃣  Testing Destination Institution (Inst 2) Approving Transfer Request...');
    const approveRes = await makeRequest(
      { hostname: 'localhost', port: 5000, path: `/api/transfers/${transfer1Id}/review`, method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${inst2Token}` } },
      { status: 'APPROVED', remarks: 'Academic credits accepted per NEP 2020 equivalency rules.' }
    );
    console.log(`   Status: ${approveRes.status} (Expected: 200)`);
    console.log(`   Updated Status: ${approveRes.body.data.status}`);
    if (approveRes.status !== 200 || approveRes.body.data.status !== 'APPROVED') {
      throw new Error('Destination institution approval failed');
    }

    // 10. Student 2 submits a transfer request, Inst 1 rejects it
    console.log('\n🔟 Testing Student 2 Transfer Submission and Inst 1 Rejection...');
    const tr2 = await makeRequest(
      { hostname: 'localhost', port: 5000, path: '/api/transfers', method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${student2Token}` } },
      { destinationInstitutionId: inst1Id, creditIds: [credit2Id], reason: 'Transferring to IITB' }
    );
    transfer2Id = tr2.body.data._id;

    const rejectRes = await makeRequest(
      { hostname: 'localhost', port: 5000, path: `/api/transfers/${transfer2Id}/review`, method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${inst1Token}` } },
      { status: 'REJECTED', rejectionReason: 'Syllabus mismatch exceeds 30% limit.' }
    );
    console.log(`   Status: ${rejectRes.status} (Expected: 200)`);
    console.log(`   Updated Status: ${rejectRes.body.data.status}`);
    if (rejectRes.status !== 200 || rejectRes.body.data.status !== 'REJECTED') {
      throw new Error('Transfer rejection failed');
    }

    // 11. Student 1 views own transfer requests
    console.log('\n1️⃣1️⃣ Testing Student 1 Viewing Own Transfer Requests...');
    const std1Transfers = await makeRequest(
      { hostname: 'localhost', port: 5000, path: '/api/transfers', method: 'GET', headers: { Authorization: `Bearer ${student1Token}` } }
    );
    console.log(`   Status: ${std1Transfers.status} (Expected: 200)`);
    console.log(`   Student 1 transfers count: ${std1Transfers.body.data.length}`);
    if (std1Transfers.body.data.length === 0) throw new Error('Student could not view own transfers');

    // 12. Student 1 cannot view Student 2\'s transfer request details (Expected 403)
    console.log('\n1️⃣2️⃣ Testing Student 1 Viewing Student 2 Transfer Request Details (Expected 403)...');
    const stdSpyTransfer = await makeRequest(
      { hostname: 'localhost', port: 5000, path: `/api/transfers/${transfer2Id}`, method: 'GET', headers: { Authorization: `Bearer ${student1Token}` } }
    );
    console.log(`   Status: ${stdSpyTransfer.status} (Expected: 403)`);
    if (stdSpyTransfer.status !== 403) throw new Error('Student 1 was able to spy on Student 2 transfer request');

    // 13. Student 1 creates new transfer and cancels pending request
    console.log('\n1️⃣3️⃣ Testing Student Pending Transfer Request Cancellation...');
    // Create new course & credit for Student 1 to avoid active conflict
    const c1b = await makeRequest(
      { hostname: 'localhost', port: 5000, path: '/api/courses', method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${inst1Token}` } },
      { courseCode: `CS402_${testId}`, courseName: 'Computer Networks', credits: 4, department: 'CSE', semester: 4 }
    );
    const cr1b = await makeRequest(
      { hostname: 'localhost', port: 5000, path: '/api/credits', method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${inst1Token}` } },
      { studentEmail: student1Email, courseId: c1b.body.data._id, credits: 4, grade: 'A', semester: 4, academicYear: '2025-26', verificationStatus: 'verified' }
    );

    const tr3 = await makeRequest(
      { hostname: 'localhost', port: 5000, path: '/api/transfers', method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${student1Token}` } },
      { destinationInstitutionId: inst3Id, creditIds: [cr1b.body.data._id], reason: 'Trial application' }
    );
    const cancelRes = await makeRequest(
      { hostname: 'localhost', port: 5000, path: `/api/transfers/${tr3.body.data._id}/cancel`, method: 'PUT', headers: { Authorization: `Bearer ${student1Token}` } }
    );
    console.log(`   Status: ${cancelRes.status} (Expected: 200)`);
    console.log(`   Cancelled Status: ${cancelRes.body.data.status}`);
    if (cancelRes.status !== 200 || cancelRes.body.data.status !== 'CANCELLED') {
      throw new Error('Transfer cancellation failed');
    }

       // 15. Admin can view transfer request details
    console.log('\n15. Testing Admin Access to Transfer Request Details...');
    const adminTransferDetail = await makeRequest(
      {
        hostname: 'localhost',
        port: 5000,
        path: `/api/transfers/${transfer1Id}`,
        method: 'GET',
        headers: {
          Authorization: `Bearer ${adminToken}`
        }
      }
    );
    console.log(`   Status: ${adminTransferDetail.status} (Expected: 200)`);
    if (
      adminTransferDetail.status !== 200 ||
      adminTransferDetail.body.data._id !== transfer1Id
    ) {
      throw new Error('Admin could not access transfer request details');
    }

    // 16. Approved transfer cannot be cancelled
    console.log('\n16. Testing Cancellation Protection for Approved Transfer (Expected 400)...');
    const cancelApproved = await makeRequest(
      {
        hostname: 'localhost',
        port: 5000,
        path: `/api/transfers/${transfer1Id}/cancel`,
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${student1Token}`
        }
      }
    );
    console.log(`   Status: ${cancelApproved.status} (Expected: 400)`);
    if (cancelApproved.status !== 400) {
      throw new Error('Approved transfer request was incorrectly allowed to be cancelled');
    }

    console.log('\n🎉 ALL 16 PHASE 4 CREDIT TRANSFER TESTS PASSED SUCCESSFULLY!\n');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Phase 4 Test Suite Failed:', error.message);
    process.exit(1);
  }
}

runPhase4Tests();
