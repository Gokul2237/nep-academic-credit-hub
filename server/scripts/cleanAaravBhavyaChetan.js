const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

async function removeAaravBhavyaChetan() {
  const mongoURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/nep_academic_hub';
  console.log(`Connecting to: ${mongoURI}`);
  await mongoose.connect(mongoURI);

  const db = mongoose.connection.db;

  // Identify target users
  const targetStudentIds = ['ABC-TEST1-9828', 'ABC-TEST2-9828', 'ABC-TEST3-9828'];
  const targetUserEmails = [
    'stu1_9828@bit.edu',
    'stu2_9828@bit.edu',
    'stu3_9828@kit.edu',
    'dean_inst_a_9828@bit.edu',
    'dean_inst_a_8206@bit.edu'
  ];

  const targetUsers = await db.collection('users').find({
    $or: [
      { studentId: { $in: targetStudentIds } },
      { email: { $in: targetUserEmails } }
    ]
  }).toArray();

  console.log(`Target users found to delete: ${targetUsers.length}`);
  for (const u of targetUsers) {
    console.log(`- ${u.name} (${u.email}) [ABC ID: ${u.studentId || 'N/A'}] ID: ${u._id}`);
  }

  const targetUserIds = targetUsers.map(u => u._id);

  // Check any credits, results, or batches linked to these users
  const linkedCredits = await db.collection('academiccredits').find({
    studentId: { $in: targetUserIds }
  }).toArray();
  console.log(`Linked academic credits: ${linkedCredits.length}`);

  const linkedResults = await db.collection('semesterresults').find({
    studentId: { $in: targetUserIds }
  }).toArray();
  console.log(`Linked semester results: ${linkedResults.length}`);

  const linkedBatches = await db.collection('resultimportbatches').find({
    createdBy: { $in: targetUserIds }
  }).toArray();
  console.log(`Linked import batches: ${linkedBatches.length}`);

  const linkedAuditLogs = await db.collection('auditlogs').find({
    $or: [
      { userId: { $in: targetUserIds } },
      { entityId: { $in: targetUserIds } }
    ]
  }).toArray();
  console.log(`Linked audit logs: ${linkedAuditLogs.length}`);

  // Safety check: ensure none are genuine demo students
  for (const u of targetUsers) {
    if (u.studentId && !u.studentId.startsWith('ABC-TEST')) {
      throw new Error(`SAFETY ABORT: Cannot delete non-test student: ${u.studentId}`);
    }
  }

  // Backup snapshot before deletion
  const backupDir = path.join(__dirname, '..', '..', 'backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFile = path.join(backupDir, `deleted_aarav_bhavya_chetan_${timestamp}.json`);
  const snapshot = {
    deletedAt: new Date().toISOString(),
    users: targetUsers,
    academicCredits: linkedCredits,
    semesterResults: linkedResults,
    resultImportBatches: linkedBatches,
    auditLogs: linkedAuditLogs
  };

  fs.writeFileSync(backupFile, JSON.stringify(snapshot, null, 2), 'utf8');
  console.log(`\n✅ Snapshot backup written to: ${backupFile}`);

  // Execute deletion
  console.log('\n--- EXECUTING DELETIONS ---');
  const delUsers = await db.collection('users').deleteMany({
    _id: { $in: targetUserIds }
  });
  console.log(`Users deleted: ${delUsers.deletedCount}`);

  if (linkedCredits.length > 0) {
    const delCredits = await db.collection('academiccredits').deleteMany({
      _id: { $in: linkedCredits.map(c => c._id) }
    });
    console.log(`Academic credits deleted: ${delCredits.deletedCount}`);
  }

  if (linkedResults.length > 0) {
    const delResults = await db.collection('semesterresults').deleteMany({
      _id: { $in: linkedResults.map(r => r._id) }
    });
    console.log(`Semester results deleted: ${delResults.deletedCount}`);
  }

  if (linkedBatches.length > 0) {
    const delBatches = await db.collection('resultimportbatches').deleteMany({
      _id: { $in: linkedBatches.map(b => b._id) }
    });
    console.log(`Import batches deleted: ${delBatches.deletedCount}`);
  }

  if (linkedAuditLogs.length > 0) {
    const delAudit = await db.collection('auditlogs').deleteMany({
      _id: { $in: linkedAuditLogs.map(a => a._id) }
    });
    console.log(`Audit logs deleted: ${delAudit.deletedCount}`);
  }

  // Post-deletion verification
  console.log('\n--- POST-DELETION VERIFICATION ---');
  const remainingTargetUsers = await db.collection('users').countDocuments({
    $or: [
      { studentId: { $in: targetStudentIds } },
      { email: { $in: targetUserEmails } },
      { name: { $regex: /aarav test|bhavya|chetan/i } }
    ]
  });
  console.log(`Remaining Aarav/Bhavya/Chetan test users (must be 0): ${remainingTargetUsers}`);

  const genuineStudents = await db.collection('users').find({
    role: 'student',
    createdAt: { $lt: new Date('2026-10-18T00:00:00Z') }
  }).toArray();
  console.log(`Original genuine students intact: ${genuineStudents.length} (expected 109)`);
  const sem1Count = genuineStudents.filter(s => s.currentSemester === 1).length;
  console.log(`Genuine students with currentSemester === 1: ${sem1Count} (expected 109)`);

  const totalUsersRemaining = await db.collection('users').countDocuments();
  console.log(`Total users remaining in DB: ${totalUsersRemaining}`);

  await mongoose.disconnect();
  console.log('\n✅ Cleanup of Aarav, Bhavya, Chetan test accounts completed successfully.');
}

removeAaravBhavyaChetan().catch(err => {
  console.error('❌ Deletion failed:', err);
  process.exit(1);
});
