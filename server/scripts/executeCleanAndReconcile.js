/**
 * Production-Safe Database Cleanup & Reconciliation Script
 * (Verified Backup-and-Rollback Procedure for standalone MongoDB)
 * 
 * Implements:
 * 1. Verification of database name strictly === 'nep_academic_hub'.
 * 2. Pre-operation snapshot backup written to disk in backups/ and read-verified.
 * 3. Stepwise deletion with rollback capability if any verification check fails.
 * 4. Removal of the 23 specified unwanted courses by exact IDs.
 * 5. Removal of the 8 dependent test academic credits & 8 test semester results by exact IDs.
 * 6. Removal of the 6 test import batches and 6 test audit logs by exact IDs.
 * 7. Reconciliation of test accounts: removing old test accounts and creating
 *    exactly 4 clearly identifiable test students across BIT001 (2) and KIT002 (2).
 * 8. Comprehensive verification that the 350 imported credits and traceability remain 100% intact.
 */

const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const SOURCE_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/nep_academic_hub';

// Exact unwanted course codes
const UNWANTED_COURSE_CODES = [
  'CS8545',
  'CS8692',
  'CSB8545',
  'CSB8692',
  'CS-ADV-5124',
  'CS-ADV-7414',
  'CS-ADV-8792',
  'CS401_2553',
  'CS401_2729',
  'CS401_3071',
  'CS401_4008',
  'CS402_2553',
  'CS402_2729',
  'CS402_3071',
  'CS402_4008',
  'CS501_6513',
  'EC301_2553',
  'EC301_2729',
  'EC301_3071',
  'EC301_4008',
  'NITK101_6513',
  'P5C1_5675',
  'P5C2_5675'
];

// Preserved genuine batch ID & audit log
const GENUINE_BATCH_ID = '6ad5ab36d5abc10e51354038';
const GENUINE_AUDIT_LOG_ID = '6ad5ab3fd5abc10e5135474d';

async function runCleanup() {
  console.log('===============================================================');
  console.log('🛡️  NEP ACADEMIC HUB: VERIFIED CLEANUP & RECONCILIATION');
  console.log('===============================================================\n');

  console.log(`🔌 Connecting to: ${SOURCE_URI}`);
  const conn = await mongoose.createConnection(SOURCE_URI, {
    serverSelectionTimeoutMS: 5000,
  }).asPromise();

  if (conn.name !== 'nep_academic_hub') {
    throw new Error(`CRITICAL ABORT: Connected to database '${conn.name}', expected 'nep_academic_hub'.`);
  }

  const db = conn.db;

  // 1. Identify Unwanted Courses
  const coursesToDelete = await db.collection('courses').find({
    courseCode: { $in: UNWANTED_COURSE_CODES }
  }).toArray();

  console.log(`Identified ${coursesToDelete.length} unwanted courses (expected 23):`);
  coursesToDelete.forEach(c => console.log(`  - ${c.courseCode}: ${c.courseName} [ID: ${c._id}]`));

  if (coursesToDelete.length !== 23) {
    throw new Error(`SAFETY ABORT: Found ${coursesToDelete.length} courses matching unwanted codes, expected exactly 23.`);
  }

  const courseIdsToDelete = coursesToDelete.map(c => c._id);

  // 2. Identify Dependent Test Credits & Results
  const creditsToDelete = await db.collection('academiccredits').find({
    courseId: { $in: courseIdsToDelete }
  }).toArray();

  console.log(`\nIdentified ${creditsToDelete.length} dependent academic credits (expected 8 test credits):`);
  creditsToDelete.forEach(c => console.log(`  - Credit ID: ${c._id}, courseId: ${c.courseId}, studentId: ${c.studentId}, credits: ${c.credits}`));

  if (creditsToDelete.length !== 8) {
    throw new Error(`SAFETY ABORT: Found ${creditsToDelete.length} credits linked to unwanted courses, expected exactly 8.`);
  }

  const creditIdsToDelete = creditsToDelete.map(c => c._id);

  const semesterResultsToDelete = await db.collection('semesterresults').find({
    courseId: { $in: courseIdsToDelete }
  }).toArray();

  console.log(`\nIdentified ${semesterResultsToDelete.length} dependent semester results (expected 8 test results):`);
  if (semesterResultsToDelete.length !== 8) {
    throw new Error(`SAFETY ABORT: Found ${semesterResultsToDelete.length} semester results linked to unwanted courses, expected exactly 8.`);
  }

  const semesterResultIdsToDelete = semesterResultsToDelete.map(r => r._id);

  // 3. Identify Test Import Batches (excluding the genuine batch of 350 credits)
  const batchesToDelete = await db.collection('resultimportbatches').find({
    _id: { $ne: new mongoose.Types.ObjectId(GENUINE_BATCH_ID) }
  }).toArray();

  console.log(`\nIdentified ${batchesToDelete.length} test import batches to delete (expected 6):`);
  batchesToDelete.forEach(b => console.log(`  - Batch: ${b.batchId} [ID: ${b._id}, status: ${b.status}]`));

  if (batchesToDelete.length !== 6) {
    throw new Error(`SAFETY ABORT: Found ${batchesToDelete.length} test batches to delete, expected exactly 6.`);
  }

  const batchIdsToDelete = batchesToDelete.map(b => b._id);

  // 4. Identify Test Audit Logs (6 test logs from 2026-10-25)
  const testAuditLogIds = [
    new mongoose.Types.ObjectId('6add9d56e5d1450a9272ad9f'),
    new mongoose.Types.ObjectId('6add9d56e5d1450a9272adcc'),
    new mongoose.Types.ObjectId('6add9d56e5d1450a9272add7'),
    new mongoose.Types.ObjectId('6addb5bf5f55cafb0e60cb90'),
    new mongoose.Types.ObjectId('6addb5bf5f55cafb0e60cbbd'),
    new mongoose.Types.ObjectId('6addb5bf5f55cafb0e60cbc8'),
  ];

  const auditLogsToDelete = await db.collection('auditlogs').find({
    _id: { $in: testAuditLogIds }
  }).toArray();

  console.log(`\nIdentified ${auditLogsToDelete.length} test audit logs to delete (expected 6):`);
  auditLogsToDelete.forEach(a => console.log(`  - Log ID: ${a._id}, action: ${a.action}, date: ${a.createdAt.toISOString()}`));

  if (auditLogsToDelete.length !== 6) {
    throw new Error(`SAFETY ABORT: Found ${auditLogsToDelete.length} test audit logs, expected exactly 6.`);
  }

  // 5. Identify Old Test Users to Reconcile
  const oldTestUserEmails = [
    'stu1_8692@bit.edu',
    'stu2_8692@bit.edu',
    'stu3_8692@kit.edu',
    'stu1_8545@bit.edu',
    'stu2_8545@bit.edu',
    'stu3_8545@kit.edu',
    'dean_inst_a_8692@bit.edu',
    'dean_inst_a_8545@bit.edu',
  ];

  const usersToDelete = await db.collection('users').find({
    email: { $in: oldTestUserEmails }
  }).toArray();

  console.log(`\nIdentified ${usersToDelete.length} old test accounts to reconcile (expected 8):`);
  usersToDelete.forEach(u => console.log(`  - ${u.name} (${u.email}) [ID: ${u._id}, role: ${u.role}]`));

  if (usersToDelete.length !== 8) {
    throw new Error(`SAFETY ABORT: Found ${usersToDelete.length} old test users, expected exactly 8.`);
  }

  const userIdsToDelete = usersToDelete.map(u => u._id);

  // 6. Pre-Deletion Safety Snapshot & Verification
  const backupDir = path.join(__dirname, '..', '..', 'backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const snapshotFile = path.join(backupDir, `cleanup_pre_snapshot_${timestamp}.json`);
  const snapshotData = {
    createdAt: new Date().toISOString(),
    sourceDb: 'nep_academic_hub',
    coursesToDelete,
    creditsToDelete,
    semesterResultsToDelete,
    batchesToDelete,
    auditLogsToDelete,
    usersToDelete,
  };

  fs.writeFileSync(snapshotFile, JSON.stringify(snapshotData, null, 2), 'utf8');
  // Read back to verify
  const readBack = JSON.parse(fs.readFileSync(snapshotFile, 'utf8'));
  if (!readBack.coursesToDelete || readBack.coursesToDelete.length !== 23) {
    throw new Error('Pre-snapshot readback verification failed!');
  }
  console.log(`\n💾 Pre-deletion snapshot saved and verified at: ${snapshotFile}`);

  // 7. Prepare the 4 Designated Test Students
  const bitInst = await db.collection('institutions').findOne({ code: 'BIT001' });
  const kitInst = await db.collection('institutions').findOne({ code: 'KIT002' });

  if (!bitInst || !kitInst) {
    throw new Error('Institutions BIT001 or KIT002 not found in database.');
  }

  // Use standard demo account password convention
  const demoPassword = process.env.DEMO_STUDENT_PASSWORD || 'Student@123456';
  const salt = await bcrypt.genSalt(12);
  const passwordHash = await bcrypt.hash(demoPassword, salt);

  const designatedTestStudents = [
    {
      name: 'Test Student 1',
      email: 'test.student1@bit.edu',
      passwordHash,
      role: 'student',
      studentId: 'ABC-TEST-BIT01',
      currentSemester: 1,
      institutionId: bitInst._id,
      institutionCode: bitInst.code,
      institutionName: bitInst.name,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      name: 'Test Student 2',
      email: 'test.student2@bit.edu',
      passwordHash,
      role: 'student',
      studentId: 'ABC-TEST-BIT02',
      currentSemester: 1,
      institutionId: bitInst._id,
      institutionCode: bitInst.code,
      institutionName: bitInst.name,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      name: 'Test Student 3',
      email: 'test.student3@kit.edu',
      passwordHash,
      role: 'student',
      studentId: 'ABC-TEST-KIT01',
      currentSemester: 1,
      institutionId: kitInst._id,
      institutionCode: kitInst.code,
      institutionName: kitInst.name,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      name: 'Test Student 4',
      email: 'test.student4@kit.edu',
      passwordHash,
      role: 'student',
      studentId: 'ABC-TEST-KIT02',
      currentSemester: 1,
      institutionId: kitInst._id,
      institutionCode: kitInst.code,
      institutionName: kitInst.name,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  // 8. Execute Stepwise Cleanup with Rollback Safety
  console.log('\n🚀 Executing Stepwise Verified Cleanup...');
  let rollbackNeeded = false;
  let insertedStudentIds = [];

  try {
    // Delete Courses
    const courseRes = await db.collection('courses').deleteMany({ _id: { $in: courseIdsToDelete } });
    console.log(`✓ Deleted ${courseRes.deletedCount} courses`);

    // Delete Dependent Credits
    const creditRes = await db.collection('academiccredits').deleteMany({ _id: { $in: creditIdsToDelete } });
    console.log(`✓ Deleted ${creditRes.deletedCount} test academic credits`);

    // Delete Dependent Semester Results
    const semRes = await db.collection('semesterresults').deleteMany({ _id: { $in: semesterResultIdsToDelete } });
    console.log(`✓ Deleted ${semRes.deletedCount} test semester results`);

    // Delete Test Import Batches
    const batchRes = await db.collection('resultimportbatches').deleteMany({ _id: { $in: batchIdsToDelete } });
    console.log(`✓ Deleted ${batchRes.deletedCount} test result import batches`);

    // Delete Test Audit Logs
    const auditRes = await db.collection('auditlogs').deleteMany({ _id: { $in: testAuditLogIds } });
    console.log(`✓ Deleted ${auditRes.deletedCount} test audit logs`);

    // Delete Old Test Users
    const userRes = await db.collection('users').deleteMany({ _id: { $in: userIdsToDelete } });
    console.log(`✓ Deleted ${userRes.deletedCount} old test users`);

    // Insert 4 Designated Test Students
    const insertRes = await db.collection('users').insertMany(designatedTestStudents);
    insertedStudentIds = Object.values(insertRes.insertedIds);
    console.log(`✓ Inserted ${insertedStudentIds.length} designated test students`);

    // --- VERIFICATION POST-OPERATION ---
    console.log('\n🔍 Verifying Database Integrity Post-Operation...');

    // A. Verify exactly 350 credits remain
    const totalCreditsRemaining = await db.collection('academiccredits').countDocuments({});
    console.log(`- Academic credits remaining: ${totalCreditsRemaining} (must be exactly 350)`);
    if (totalCreditsRemaining !== 350) {
      rollbackNeeded = true;
      throw new Error(`VERIFICATION FAILURE: Total credits remaining is ${totalCreditsRemaining}, expected 350.`);
    }

    // B. Verify all 350 credits belong to the genuine batch
    const genuineCreditsCount = await db.collection('academiccredits').countDocuments({
      importBatchId: new mongoose.Types.ObjectId(GENUINE_BATCH_ID)
    });
    console.log(`- Genuine batch credits: ${genuineCreditsCount} (must be exactly 350)`);
    if (genuineCreditsCount !== 350) {
      rollbackNeeded = true;
      throw new Error(`VERIFICATION FAILURE: Genuine batch credits is ${genuineCreditsCount}, expected 350.`);
    }

    // C. Verify genuine batch exists
    const genuineBatch = await db.collection('resultimportbatches').findOne({
      _id: new mongoose.Types.ObjectId(GENUINE_BATCH_ID)
    });
    if (!genuineBatch) {
      rollbackNeeded = true;
      throw new Error('VERIFICATION FAILURE: Preserved genuine batch was not found.');
    }
    console.log(`- Genuine import batch preserved: ${genuineBatch.batchId}`);

    // D. Verify total batches === 1
    const totalBatches = await db.collection('resultimportbatches').countDocuments({});
    console.log(`- Total import batches remaining: ${totalBatches} (must be exactly 1)`);
    if (totalBatches !== 1) {
      rollbackNeeded = true;
      throw new Error(`VERIFICATION FAILURE: Total import batches is ${totalBatches}, expected 1.`);
    }

    // E. Verify genuine audit log exists
    const genuineAudit = await db.collection('auditlogs').findOne({
      _id: new mongoose.Types.ObjectId(GENUINE_AUDIT_LOG_ID)
    });
    if (!genuineAudit) {
      rollbackNeeded = true;
      throw new Error('VERIFICATION FAILURE: Preserved genuine audit log was not found.');
    }
    console.log(`- Genuine import audit log preserved: ${genuineAudit.action} for ${GENUINE_BATCH_ID}`);

    // F. Verify audit logs count === 14
    const totalAuditLogs = await db.collection('auditlogs').countDocuments({});
    console.log(`- Total audit logs remaining: ${totalAuditLogs} (must be exactly 14)`);
    if (totalAuditLogs !== 14) {
      rollbackNeeded = true;
      throw new Error(`VERIFICATION FAILURE: Total audit logs is ${totalAuditLogs}, expected 14.`);
    }

    // G. Verify courses count === 26 and no unwanted codes exist
    const totalCourses = await db.collection('courses').countDocuments({});
    console.log(`- Total courses remaining: ${totalCourses} (must be exactly 26)`);
    if (totalCourses !== 26) {
      rollbackNeeded = true;
      throw new Error(`VERIFICATION FAILURE: Total courses is ${totalCourses}, expected 26.`);
    }

    const unwantedRemaining = await db.collection('courses').countDocuments({
      courseCode: { $in: UNWANTED_COURSE_CODES }
    });
    if (unwantedRemaining !== 0) {
      rollbackNeeded = true;
      throw new Error(`VERIFICATION FAILURE: Found ${unwantedRemaining} unwanted courses remaining.`);
    }

    // H. Verify exactly 4 designated test students
    const testStudents = await db.collection('users').find({
      $or: [
        { studentId: { $regex: /TEST/i } },
        { name: { $regex: /Test Student/i } }
      ]
    }).toArray();

    console.log(`- Designated test students in DB: ${testStudents.length} (must be exactly 4)`);
    if (testStudents.length !== 4) {
      rollbackNeeded = true;
      throw new Error(`VERIFICATION FAILURE: Test students count is ${testStudents.length}, expected 4.`);
    }

    const bitStudents = testStudents.filter(s => s.institutionCode === 'BIT001');
    const kitStudents = testStudents.filter(s => s.institutionCode === 'KIT002');
    console.log(`  * BIT001 students: ${bitStudents.length} (expected 2)`);
    console.log(`  * KIT002 students: ${kitStudents.length} (expected 2)`);

    if (bitStudents.length !== 2 || kitStudents.length !== 2) {
      rollbackNeeded = true;
      throw new Error('VERIFICATION FAILURE: Test students not evenly split 2:2 across BIT001 and KIT002.');
    }

    console.log('\n✅ ALL INTEGRITY VERIFICATIONS PASSED PERFECTLY!');

  } catch (err) {
    console.error('\n❌ ERROR ENCOUNTERED:', err.message);
    if (rollbackNeeded) {
      console.log('🔄 Executing Rollback from Verified Snapshot...');
      if (insertedStudentIds.length > 0) {
        await db.collection('users').deleteMany({ _id: { $in: insertedStudentIds } });
      }
      if (coursesToDelete.length > 0) {
        await db.collection('courses').insertMany(coursesToDelete);
      }
      if (creditsToDelete.length > 0) {
        await db.collection('academiccredits').insertMany(creditsToDelete);
      }
      if (semesterResultsToDelete.length > 0) {
        await db.collection('semesterresults').insertMany(semesterResultsToDelete);
      }
      if (batchesToDelete.length > 0) {
        await db.collection('resultimportbatches').insertMany(batchesToDelete);
      }
      if (auditLogsToDelete.length > 0) {
        await db.collection('auditlogs').insertMany(auditLogsToDelete);
      }
      if (usersToDelete.length > 0) {
        await db.collection('users').insertMany(usersToDelete);
      }
      console.log('✅ Rollback completed successfully.');
    }
    throw err;
  } finally {
    await conn.close();
  }

  console.log('===============================================================');
  console.log('🎉 ALL DATABASE OPERATIONS AND VERIFICATIONS COMPLETED');
  console.log('===============================================================');
}

if (require.main === module) {
  runCleanup().catch(err => {
    console.error('Fatal cleanup error:', err);
    process.exit(1);
  });
}

module.exports = { runCleanup };
