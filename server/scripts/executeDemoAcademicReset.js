const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const connectDB = require('../config/db');
const { User, ROLES } = require('../models/User');
const { AcademicCredit } = require('../models/AcademicCredit');
const { TransferRequest } = require('../models/TransferRequest');
const { Transcript } = require('../models/Transcript');
const AuditLog = require('../models/AuditLog');

async function executeDemoReset() {
  console.log('🔄 Executing Explicitly Authorized Demo Academic Reset...');

  await connectDB();
  if (mongoose.connection.readyState !== 1) {
    throw new Error('Database is not connected');
  }

  // 1. Inspect initial counts
  const initialStudentCount = await User.countDocuments({ role: ROLES.STUDENT });
  const initialCreditCount = await AcademicCredit.countDocuments();
  const initialTransferCount = await TransferRequest.countDocuments();
  const initialTranscriptCount = await Transcript.countDocuments();

  console.log(`📊 Initial State:`);
  console.log(`   - Students: ${initialStudentCount}`);
  console.log(`   - Academic Credits: ${initialCreditCount}`);
  console.log(`   - Transfer Requests: ${initialTransferCount}`);
  console.log(`   - Transcripts: ${initialTranscriptCount}`);

  // 2. Set all students' currentSemester to 1
  const studentUpdateResult = await User.updateMany(
    { role: ROLES.STUDENT },
    { $set: { currentSemester: 1 } }
  );
  console.log(`✓ Updated ${studentUpdateResult.modifiedCount} student accounts to currentSemester = 1.`);

  // 3. Delete previously awarded demo academic credits
  const creditDeleteResult = await AcademicCredit.deleteMany({});
  console.log(`✓ Deleted ${creditDeleteResult.deletedCount} demo academic credits.`);

  // 4. Cascade reset linked transfer requests
  const transferResetResult = await TransferRequest.deleteMany({});
  console.log(`✓ Reset ${transferResetResult.deletedCount} transfer requests to maintain referential integrity.`);

  // 5. Cascade reset dependent transcripts
  const transcriptResetResult = await Transcript.deleteMany({});
  console.log(`✓ Reset ${transcriptResetResult.deletedCount} transcripts to maintain referential integrity.`);

  // 6. Record immutable Audit Log
  const auditLog = await AuditLog.create({
    logId: `LOG-RESET-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    action: 'DEMO_ACADEMIC_RESET',
    resource: 'AcademicCredit,User,TransferRequest,Transcript',
    details: {
      studentsReset: studentUpdateResult.modifiedCount,
      creditsDeleted: creditDeleteResult.deletedCount,
      transfersReset: transferResetResult.deletedCount,
      transcriptsReset: transcriptResetResult.deletedCount,
      newCurrentSemester: 1,
      reason: 'User-authorized demo academic reset for semester results import and progression setup',
      timestamp: new Date().toISOString(),
    },
    ipAddress: '127.0.0.1',
  });
  console.log(`✓ Created Audit Log entry: ${auditLog.logId}`);

  // 7. Verify final counts
  const finalStudentsAtSem1 = await User.countDocuments({ role: ROLES.STUDENT, currentSemester: 1 });
  const finalCredits = await AcademicCredit.countDocuments();
  const finalTransfers = await TransferRequest.countDocuments();
  const finalTranscripts = await Transcript.countDocuments();

  console.log(`\n✅ Reset Completed Successfully:`);
  console.log(`   - Students at Semester 1: ${finalStudentsAtSem1}/${initialStudentCount}`);
  console.log(`   - Remaining Credits: ${finalCredits}`);
  console.log(`   - Remaining Transfers: ${finalTransfers}`);
  console.log(`   - Remaining Transcripts: ${finalTranscripts}`);

  process.exit(0);
}

if (require.main === module) {
  executeDemoReset().catch((err) => {
    console.error('❌ Reset failed:', err);
    process.exit(1);
  });
}

module.exports = executeDemoReset;
