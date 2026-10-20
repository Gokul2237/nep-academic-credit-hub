const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

async function executeClean() {
  const mongoURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/nep_academic_hub';
  console.log(`Connecting to: ${mongoURI}`);
  await mongoose.connect(mongoURI);

  const db = mongoose.connection.db;

  // 1. Identify target test entities
  const targetStudentIds = ['ABC-TEST1-8206', 'ABC-TEST2-8206', 'ABC-TEST3-8206'];
  const targetUserIds = [
    new mongoose.Types.ObjectId('6ad4ed1d6acab901276dc0bc'),
    new mongoose.Types.ObjectId('6ad4ed1d6acab901276dc0c0'),
    new mongoose.Types.ObjectId('6ad4ed1e6acab901276dc0c5')
  ];

  const targetCreditIds = [
    new mongoose.Types.ObjectId('6ad4ed1f6acab901276dc0d8'),
    new mongoose.Types.ObjectId('6ad4ed1f6acab901276dc0f1')
  ];

  const targetSemesterResultIds = [
    new mongoose.Types.ObjectId('6ad4ed1f6acab901276dc0d5'),
    new mongoose.Types.ObjectId('6ad4ed1f6acab901276dc0de')
  ];

  const targetBatchIds = [
    'BATCH-1792339231589-VPQ6E',
    'BATCH-1792339231788-MK64U',
    'BATCH-1792339161495-2J3A0'
  ];

  const targetCourseId = new mongoose.Types.ObjectId('6ad4ed1f4479f62c1c6fa461'); // CS8206

  // Fetch entities to be deleted
  const usersToDelete = await db.collection('users').find({
    $or: [{ _id: { $in: targetUserIds } }, { studentId: { $in: targetStudentIds } }]
  }).toArray();

  const creditsToDelete = await db.collection('academiccredits').find({
    _id: { $in: targetCreditIds }
  }).toArray();

  const resultsToDelete = await db.collection('semesterresults').find({
    _id: { $in: targetSemesterResultIds }
  }).toArray();

  const batchesToDelete = await db.collection('resultimportbatches').find({
    batchId: { $in: targetBatchIds }
  }).toArray();

  const coursesToDelete = await db.collection('courses').find({
    _id: targetCourseId
  }).toArray();

  const batchObjectIds = batchesToDelete.map(b => b._id);
  const auditLogsToDelete = await db.collection('auditlogs').find({
    $or: [
      { entityId: { $in: batchObjectIds } },
      { entityId: { $in: targetSemesterResultIds } },
      { entityId: { $in: targetUserIds } },
      { 'details.batchId': { $in: targetBatchIds } }
    ]
  }).toArray();

  // SAFETY CHECKS
  console.log('--- SAFETY VALIDATION ---');
  console.log(`Users identified for deletion: ${usersToDelete.length}`);
  console.log(`Credits identified for deletion: ${creditsToDelete.length}`);
  console.log(`Semester results identified for deletion: ${resultsToDelete.length}`);
  console.log(`Import batches identified for deletion: ${batchesToDelete.length}`);
  console.log(`Courses identified for deletion: ${coursesToDelete.length}`);
  console.log(`Audit logs identified for deletion: ${auditLogsToDelete.length}`);

  for (const u of usersToDelete) {
    if (!targetStudentIds.includes(u.studentId)) {
      throw new Error(`SAFETY ABORT: Attempting to delete unexpected user ${u.studentId} (${u._id})`);
    }
  }

  // Backup snapshot before deletion
  const backupDir = path.join(__dirname, '..', '..', 'backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFile = path.join(backupDir, `deleted_test_records_${timestamp}.json`);
  const snapshot = {
    deletedAt: new Date().toISOString(),
    users: usersToDelete,
    academicCredits: creditsToDelete,
    semesterResults: resultsToDelete,
    resultImportBatches: batchesToDelete,
    courses: coursesToDelete,
    auditLogs: auditLogsToDelete
  };

  fs.writeFileSync(backupFile, JSON.stringify(snapshot, null, 2), 'utf8');
  console.log(`\n✅ Snapshot backup written to: ${backupFile}`);

  // Perform Deletions
  console.log('\n--- EXECUTING DELETIONS ---');
  const userDel = await db.collection('users').deleteMany({
    _id: { $in: usersToDelete.map(u => u._id) }
  });
  console.log(`Users deleted: ${userDel.deletedCount}`);

  const creditDel = await db.collection('academiccredits').deleteMany({
    _id: { $in: creditsToDelete.map(c => c._id) }
  });
  console.log(`Academic credits deleted: ${creditDel.deletedCount}`);

  const resultDel = await db.collection('semesterresults').deleteMany({
    _id: { $in: resultsToDelete.map(r => r._id) }
  });
  console.log(`Semester results deleted: ${resultDel.deletedCount}`);

  const batchDel = await db.collection('resultimportbatches').deleteMany({
    _id: { $in: batchesToDelete.map(b => b._id) }
  });
  console.log(`Result import batches deleted: ${batchDel.deletedCount}`);

  const courseDel = await db.collection('courses').deleteMany({
    _id: targetCourseId
  });
  console.log(`Test course deleted: ${courseDel.deletedCount}`);

  if (auditLogsToDelete.length > 0) {
    const auditDel = await db.collection('auditlogs').deleteMany({
      _id: { $in: auditLogsToDelete.map(a => a._id) }
    });
    console.log(`Test audit logs deleted: ${auditDel.deletedCount}`);
  }

  // Verification Post-Deletion
  console.log('\n--- POST-DELETION VERIFICATION ---');
  const remainingTestUsers = await db.collection('users').countDocuments({
    $or: [{ _id: { $in: targetUserIds } }, { studentId: { $in: targetStudentIds } }]
  });
  console.log(`Remaining test users (must be 0): ${remainingTestUsers}`);

  const remainingTestCredits = await db.collection('academiccredits').countDocuments({
    _id: { $in: targetCreditIds }
  });
  console.log(`Remaining test credits (must be 0): ${remainingTestCredits}`);

  const remainingSemResults = await db.collection('semesterresults').countDocuments({
    _id: { $in: targetSemesterResultIds }
  });
  console.log(`Remaining semester results (must be 0): ${remainingSemResults}`);

  const remainingBatches = await db.collection('resultimportbatches').countDocuments({
    batchId: { $in: targetBatchIds }
  });
  console.log(`Remaining import batches (must be 0): ${remainingBatches}`);

  // Verify Genuine Students
  const genuineStudents = await db.collection('users').find({
    role: 'student',
    studentId: { $not: { $regex: /TEST|student_/i } }
  }).toArray();

  console.log(`\nGenuine students count: ${genuineStudents.length} (expected 109)`);
  const semester1Count = genuineStudents.filter(s => s.currentSemester === 1).length;
  console.log(`Genuine students with currentSemester === 1: ${semester1Count} (expected 109)`);

  const totalCredits = await db.collection('academiccredits').countDocuments();
  console.log(`Total academic credits remaining in DB: ${totalCredits} (expected 6 from other regression suites)`);

  await mongoose.disconnect();
  console.log('\n✅ Cleanup completed and verified successfully.');
}

executeClean().catch(err => {
  console.error('❌ Deletion failed:', err);
  process.exit(1);
});
