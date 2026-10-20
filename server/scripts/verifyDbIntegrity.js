const mongoose = require('mongoose');

async function verify() {
  await mongoose.connect('mongodb://127.0.0.1:27017/nep_academic_hub');
  const db = mongoose.connection.db;

  const usersCount = await db.collection('users').countDocuments();
  const studentsCount = await db.collection('users').countDocuments({ role: 'student' });
  const genuineStudents = await db.collection('users').find({
    role: 'student',
    createdAt: { $lt: new Date('2026-10-18T00:00:00Z') }
  }).toArray();
  const sem1Count = genuineStudents.filter(s => s.currentSemester === 1).length;

  const testUsers8206 = await db.collection('users').countDocuments({ studentId: { $regex: /8206/ } });
  const testCredits = await db.collection('academiccredits').find({}).toArray();
  const semResults = await db.collection('semesterresults').countDocuments();
  const batches = await db.collection('resultimportbatches').countDocuments();

  console.log('=== VERIFICATION OF NEP_ACADEMIC_HUB ===');
  console.log('Total users in DB:', usersCount);
  console.log('Total students in DB:', studentsCount);
  console.log('Original Genuine Students (pre-today):', genuineStudents.length, '(expected 109)');
  console.log('Genuine Students with currentSemester === 1:', sem1Count, '(expected 109)');
  console.log('Feature 8206 Test Users remaining:', testUsers8206, '(must be 0)');
  console.log('Total Academic Credits in DB:', testCredits.length, '(expected 6 from untouched regression suites)');
  console.log('Semester Results in DB:', semResults, '(must be 0)');
  console.log('Result Import Batches in DB:', batches, '(must be 0)');

  await mongoose.disconnect();
}

verify().catch(console.error);
