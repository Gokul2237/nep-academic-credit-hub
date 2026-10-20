const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

async function inspect() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB.\n');

  console.log('=== ALL USERS CREATED TODAY / TEST PATTERN ===');
  const allUsers = await mongoose.connection.db.collection('users').find({}).toArray();
  const testUsers = allUsers.filter(u => 
    (u.email && /test/i.test(u.email)) ||
    (u.studentId && /test/i.test(u.studentId)) ||
    (u.name && /test/i.test(u.name)) ||
    (u.createdAt && new Date(u.createdAt) > new Date('2026-10-18T15:00:00Z'))
  );

  console.log(`Found ${testUsers.length} test-pattern / recent users:`);
  for (const u of testUsers) {
    console.log(JSON.stringify({
      _id: u._id,
      name: u.name,
      email: u.email,
      role: u.role,
      studentId: u.studentId,
      institutionId: u.institutionId,
      currentSemester: u.currentSemester,
      createdAt: u.createdAt
    }, null, 2));
  }

  console.log('\n=== ALL ACADEMIC CREDITS CURRENTLY IN DB ===');
  const credits = await mongoose.connection.db.collection('academiccredits').find({}).toArray();
  console.log(`Found ${credits.length} academic credit records:`);
  for (const c of credits) {
    console.log(JSON.stringify({
      _id: c._id,
      studentId: c.studentId,
      courseId: c.courseId,
      credits: c.credits,
      grade: c.grade,
      semester: c.semester,
      academicYear: c.academicYear,
      integrityHash: c.integrityHash,
      createdAt: c.createdAt
    }, null, 2));
  }

  console.log('\n=== ALL SEMESTER RESULTS CURRENTLY IN DB ===');
  const semResults = await mongoose.connection.db.collection('semesterresults').find({}).toArray();
  console.log(`Found ${semResults.length} semester results:`);
  for (const r of semResults) {
    console.log(JSON.stringify({
      _id: r._id,
      studentId: r.studentId,
      studentAbcId: r.studentAbcId,
      courseCode: r.courseCode,
      marks: r.marks,
      grade: r.grade,
      creditsEarned: r.creditsEarned,
      resultStatus: r.resultStatus,
      importBatchId: r.importBatchId,
      isCorrected: r.isCorrected,
      createdAt: r.createdAt
    }, null, 2));
  }

  console.log('\n=== ALL RESULT IMPORT BATCHES ===');
  const batches = await mongoose.connection.db.collection('resultimportbatches').find({}).toArray();
  console.log(`Found ${batches.length} result import batches:`);
  for (const b of batches) {
    console.log(JSON.stringify({
      _id: b._id,
      batchId: b.batchId,
      totalRows: b.totalRows,
      processedRows: b.processedRows,
      creditsAwarded: b.creditsAwarded,
      status: b.status,
      createdAt: b.createdAt
    }, null, 2));
  }

  console.log('\n=== TOTAL COUNTS ===');
  const totalStudents = await mongoose.connection.db.collection('users').countDocuments({ role: 'student' });
  console.log(`Total students in DB: ${totalStudents}`);

  process.exit(0);
}

inspect().catch(err => {
  console.error(err);
  process.exit(1);
});
