const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

async function executeCleanReset() {
  const mongoURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/nep_academic_hub';

  console.log('====================================================');
  console.log('     NEP ACADEMIC HUB - FULL CLEAN DATABASE RESET');
  console.log('====================================================');
  console.log(`Connecting to: ${mongoURI}`);
  await mongoose.connect(mongoURI);
  const db = mongoose.connection.db;

  // 1. Verify pre-cleanup backup exists
  const backupDir = path.join(__dirname, '..', '..', 'backups');
  if (!fs.existsSync(backupDir)) {
    throw new Error('Backup directory not found. Please create a backup first!');
  }
  const backupFolders = fs.readdirSync(backupDir).filter(f => f.startsWith('backup_clean_reset_'));
  if (backupFolders.length === 0) {
    throw new Error('No clean reset backup folder found. Safety abort!');
  }
  const latestBackup = backupFolders.sort().reverse()[0];
  console.log(`Verified safety backup present: ${latestBackup}`);

  // 2. Clear non-core transactional collections
  const collectionsToClear = [
    'academiccredits',
    'semesterresults',
    'resultimportbatches',
    'transferrequests',
    'certificates',
    'transcripts',
    'auditlogs',
    'apilogs',
    'apikeys'
  ];

  console.log('\n--- 1. CLEARING TRANSACTIONAL & TEST ARTIFACTS ---');
  const deletionSummary = {};
  for (const colName of collectionsToClear) {
    const countBefore = await db.collection(colName).countDocuments();
    const result = await db.collection(colName).deleteMany({});
    deletionSummary[colName] = {
      before: countBefore,
      deleted: result.deletedCount,
      remaining: await db.collection(colName).countDocuments()
    };
    console.log(`✓ ${colName.padEnd(22)}: deleted ${String(result.deletedCount).padStart(4)} records (Remaining: ${deletionSummary[colName].remaining})`);
  }

  // 3. Delete target test courses CS9828 and CSB8206
  console.log('\n--- 2. REMOVING TARGET TEST COURSES (CS9828, CSB8206) ---');
  const coursesBefore = await db.collection('courses').countDocuments();
  const delCoursesResult = await db.collection('courses').deleteMany({
    $or: [
      { code: { $in: ['CS9828', 'CSB8206'] } },
      { courseCode: { $in: ['CS9828', 'CSB8206'] } }
    ]
  });
  const coursesAfter = await db.collection('courses').countDocuments();
  console.log(`✓ Deleted ${delCoursesResult.deletedCount} test courses (CS9828, CSB8206). Remaining legitimate courses: ${coursesAfter} (Before: ${coursesBefore})`);

  // 4. Delete test student accounts
  console.log('\n--- 3. REMOVING TEST STUDENT ACCOUNTS ---');
  const testStudentFilter = {
    role: 'student',
    $or: [
      { email: { $regex: /test/i } },
      { name: { $regex: /test|3071|2553|2729|5124|8792|8387|6513|4008|179233/i } },
      { studentId: { $regex: /test|P3|P4|FULL|179233/i } },
      { studentId: { $in: ['ABC-TEST1-9828', 'ABC-TEST2-9828', 'ABC-TEST3-9828'] } },
      { createdAt: { $gte: new Date('2026-10-18T00:00:00Z') } }
    ]
  };
  const delStudentsResult = await db.collection('users').deleteMany(testStudentFilter);
  const remainingStudents = await db.collection('users').countDocuments({ role: 'student' });
  console.log(`✓ Deleted ${delStudentsResult.deletedCount} test students (including Aarav Sharma & batch test accounts). Genuine students remaining: ${remainingStudents}`);

  // 5. Delete test institutions and test institution user logins
  console.log('\n--- 4. REMOVING TEST INSTITUTIONS & DEAN LOGINS ---');
  const testInstFilter = {
    $or: [
      { code: { $regex: /_3071|_2553|_2729|_5124|_8792|_8387|_6513|_4008|P5I/i } },
      { code: { $in: ['IIT_7414', 'IIT_8792', 'IIT_5124'] } },
      { createdAt: { $gte: new Date('2026-10-18T00:00:00Z') } }
    ]
  };
  const delInstResult = await db.collection('institutions').deleteMany(testInstFilter);
  const remainingInstitutions = await db.collection('institutions').countDocuments();
  console.log(`✓ Deleted ${delInstResult.deletedCount} test institutions. Genuine institutions remaining: ${remainingInstitutions}`);

  const testInstUsersFilter = {
    role: 'institution',
    $or: [
      { email: { $regex: /dean_|phase5/i } },
      { createdAt: { $gte: new Date('2026-10-18T00:00:00Z') } }
    ]
  };
  const delInstUsersResult = await db.collection('users').deleteMany(testInstUsersFilter);
  const remainingInstUsers = await db.collection('users').countDocuments({ role: 'institution' });
  console.log(`✓ Deleted ${delInstUsersResult.deletedCount} test institution user logins. Genuine institution logins remaining: ${remainingInstUsers}`);

  // 6. Reset all genuine students' currentSemester to 1
  console.log('\n--- 5. RESETTING STUDENT PROGRESSION ---');
  const semResetResult = await db.collection('users').updateMany(
    { role: 'student' },
    { $set: { currentSemester: 1 } }
  );
  console.log(`✓ Reset all ${semResetResult.modifiedCount} genuine students to currentSemester = 1.`);

  // 7. Record immutable Audit Log for this execution
  try {
    await db.collection('auditlogs').insertOne({
      logId: `LOG-FULL-CLEAN-RESET-${Date.now()}`,
      action: 'FULL_DATABASE_CLEAN_RESET',
      resource: 'academiccredits,semesterresults,resultimportbatches,transferrequests,certificates,courses,users,institutions',
      details: {
        deletionSummary,
        coursesDeleted: delCoursesResult.deletedCount,
        testStudentsDeleted: delStudentsResult.deletedCount,
        testInstitutionsDeleted: delInstResult.deletedCount,
        testDeanLoginsDeleted: delInstUsersResult.deletedCount,
        genuineStudentsReset: semResetResult.modifiedCount,
        backupReference: latestBackup,
        executedAt: new Date().toISOString()
      },
      createdAt: new Date(),
      updatedAt: new Date()
    });
    console.log('✓ Recorded clean reset audit log.');
  } catch (err) {
    console.warn('Could not record audit log:', err.message);
  }

  // 8. Final Verification
  console.log('\n====================================================');
  console.log('             FINAL POST-RESET VERIFICATION');
  console.log('====================================================');
  const finalSummary = {};
  const allCols = await db.listCollections().toArray();
  for (const c of allCols) {
    finalSummary[c.name] = await db.collection(c.name).countDocuments();
    console.log(`${c.name.padEnd(25)}: ${finalSummary[c.name]}`);
  }

  const remainingTestCourses = await db.collection('courses').countDocuments({
    $or: [
      { code: { $in: ['CS9828', 'CSB8206'] } },
      { courseCode: { $in: ['CS9828', 'CSB8206'] } }
    ]
  });
  console.log(`Remaining CS9828/CSB8206 (must be 0): ${remainingTestCourses}`);

  const studentsCount = await db.collection('users').countDocuments({ role: 'student' });
  const sem1Count = await db.collection('users').countDocuments({ role: 'student', currentSemester: 1 });
  console.log(`Total students: ${studentsCount} (All at semester 1: ${sem1Count === studentsCount})`);

  const genuineInstList = await db.collection('institutions').find({}).project({ code: 1, name: 1 }).toArray();
  console.log('Active institutions:', genuineInstList.map(i => `[${i.code}] ${i.name}`));

  await mongoose.disconnect();
  console.log('\n✅ Clean database reset completed successfully.');
  return finalSummary;
}

if (require.main === module) {
  executeCleanReset().catch(err => {
    console.error('❌ Reset failed:', err);
    process.exit(1);
  });
}

module.exports = { executeCleanReset };
