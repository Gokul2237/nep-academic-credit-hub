const mongoose = require('mongoose');
const { TransferRequest } = require('../models/TransferRequest');
const { AcademicCredit } = require('../models/AcademicCredit');
const { User, ROLES } = require('../models/User');
const Institution = require('../models/Institution');
const AuditLog = require('../models/AuditLog');

/**
 * Execute atomic transfer completion workflow.
 * Safe against repeated calls (idempotent).
 * 
 * @param {Object} params
 * @param {string|mongoose.Types.ObjectId} params.transferId
 * @param {string|mongoose.Types.ObjectId} [params.reviewerId]
 * @param {string} [params.remarks]
 * @returns {Promise<Object>} Updated transfer document and summary
 */
const completeTransferWorkflow = async ({ transferId, reviewerId = null, remarks = '' }) => {
  const transfer = await TransferRequest.findById(transferId);
  if (!transfer) {
    throw new Error('Transfer request not found.');
  }

  // Resolve Destination Institution
  const destinationInstitution = await Institution.findById(transfer.destinationInstitutionId);
  if (!destinationInstitution) {
    throw new Error('Destination institution record not found.');
  }

  // Resolve Student User
  const student = await User.findById(transfer.studentId);
  if (!student) {
    throw new Error('Student record associated with this transfer was not found.');
  }

  // Check if transfer is already fully completed
  const isStudentAlreadyMoved =
    student.institutionId &&
    student.institutionId.toString() === destinationInstitution._id.toString();

  const isTransferMarkedCompleted = transfer.status === 'COMPLETED';

  if (isStudentAlreadyMoved && isTransferMarkedCompleted) {
    // Already completely and safely processed - idempotent return
    return {
      transfer,
      student,
      alreadyCompleted: true,
      message: 'Transfer has already been completed.',
    };
  }

  const previousInstitutionId = student.institutionId;
  const previousInstitutionCode = student.institutionCode;
  const previousInstitutionName = student.institutionName;

  // Helper execution block
  const executeUpdates = async (session) => {
    const opts = session ? { session } : {};

    // 1. Update existing student's current institutional association
    // Do not create duplicate accounts
    student.institutionId = destinationInstitution._id;
    student.institutionCode = destinationInstitution.code;
    student.institutionName = destinationInstitution.name;
    await student.save(opts);

    // 2. Make all the student's existing academic credits available under Institution B
    // Preserve original credit information, including issuing institutionId and integrityHash
    const studentCredits = await AcademicCredit.find({ studentId: student._id }, null, opts);
    const creditIdsToUpdate = studentCredits.map((c) => c._id);

    if (creditIdsToUpdate.length > 0) {
      await AcademicCredit.updateMany(
        { _id: { $in: creditIdsToUpdate } },
        {
          $set: {
            isTransferred: true,
            transferredTo: destinationInstitution._id,
            transferRequestId: transfer._id,
            transferredAt: transfer.transferredAt || new Date(),
          },
        },
        opts
      );
    }

    // 3. Update transfer request status and record completion details
    transfer.status = 'COMPLETED';
    transfer.completedAt = transfer.completedAt || new Date();
    if (reviewerId) {
      transfer.reviewedBy = reviewerId;
      transfer.completedBy = reviewerId;
    } else if (transfer.reviewedBy) {
      transfer.completedBy = transfer.reviewedBy;
    }
    if (!transfer.reviewedAt) {
      transfer.reviewedAt = transfer.completedAt;
    }
    if (remarks) {
      transfer.remarks = remarks;
    }

    // Ensure all transferred credit IDs are linked to the transfer request record
    if (creditIdsToUpdate.length > 0) {
      transfer.creditIds = creditIdsToUpdate;
      transfer.totalCredits = studentCredits.reduce((sum, c) => sum + (c.credits || 0), 0);
    }

    transfer.completionDetails = {
      completedAt: transfer.completedAt,
      previousInstitutionId,
      previousInstitutionCode,
      destinationInstitutionId: destinationInstitution._id,
      destinationInstitutionCode: destinationInstitution.code,
      studentId: student._id,
      totalCreditsTransferred: transfer.totalCredits,
      recordsCount: creditIdsToUpdate.length,
      completionType: 'AUTOMATIC_SYNCHRONIZED_MOBILITY',
    };

    await transfer.save(opts);

    // 4. Create Audit Logs for both source and destination institutions
    const auditEntries = [
      {
        logId: `LOG-TR-CMP-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        userId: reviewerId || transfer.reviewedBy || student._id,
        institutionId: destinationInstitution._id,
        action: 'TRANSFER_COMPLETED_ENROLLED',
        resource: `TransferRequest:${transfer._id}`,
        details: {
          transferId: transfer._id,
          studentId: student._id,
          studentName: student.name,
          sourceInstitutionId: transfer.sourceInstitutionId,
          destinationInstitutionId: destinationInstitution._id,
          totalCredits: transfer.totalCredits,
          transferredRecordsCount: creditIdsToUpdate.length,
          status: 'COMPLETED',
        },
        ipAddress: '127.0.0.1',
      },
      {
        logId: `LOG-TR-SRC-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        userId: reviewerId || transfer.reviewedBy || student._id,
        institutionId: transfer.sourceInstitutionId,
        action: 'TRANSFER_STUDENT_DEPARTED',
        resource: `TransferRequest:${transfer._id}`,
        details: {
          transferId: transfer._id,
          studentId: student._id,
          studentName: student.name,
          destinationInstitutionId: destinationInstitution._id,
          totalCredits: transfer.totalCredits,
          status: 'COMPLETED',
          retainedAsHistorical: true,
        },
        ipAddress: '127.0.0.1',
      },
    ];

    await AuditLog.insertMany(auditEntries, opts);

    return {
      transfer,
      student,
      creditsTransferred: creditIdsToUpdate.length,
      totalCredits: transfer.totalCredits,
    };
  };

  // Run with session/transaction if supported; fallback gracefully if standalone MongoDB
  let session = null;
  try {
    session = await mongoose.startSession();
    session.startTransaction();
    const result = await executeUpdates(session);
    await session.commitTransaction();
    return result;
  } catch (txError) {
    if (session) {
      try {
        await session.abortTransaction();
      } catch (abortErr) {
        // Suppress abort error
      }
    }

    // If transactions are not supported on standalone MongoDB instances, run directly
    if (txError.message && (txError.message.includes('replica set') || txError.message.includes('Transaction numbers'))) {
      return await executeUpdates(null);
    }
    throw txError;
  } finally {
    if (session) {
      session.endSession();
    }
  }
};

/**
 * Migration & Reconciliation helper:
 * Scans all approved transfer requests, identifies those where student movement
 * or credit transfer was uncompleted, and safely completes them.
 * 
 * @returns {Promise<Object>} Migration statistics
 */
const migrateApprovedTransfers = async () => {
  console.log('🔄 Checking for uncompleted approved transfer requests...');
  try {
    const approvedTransfers = await TransferRequest.find({
      status: { $in: ['APPROVED', 'COMPLETED'] },
    }).sort({ createdAt: 1 });

    let migratedCount = 0;
    let skippedCount = 0;
    const errors = [];

    for (const transfer of approvedTransfers) {
      try {
        const student = await User.findById(transfer.studentId);
        if (!student) {
          skippedCount++;
          continue;
        }

        const isStudentAtDestination =
          student.institutionId &&
          student.institutionId.toString() === transfer.destinationInstitutionId.toString();

        const isCompleted = transfer.status === 'COMPLETED';

        // Check if student or credits need completion
        if (!isStudentAtDestination || !isCompleted) {
          console.log(`   Applying completion workflow for transfer ${transfer._id} (Student: ${student.studentId || student.email})...`);
          await completeTransferWorkflow({
            transferId: transfer._id,
            reviewerId: transfer.reviewedBy,
            remarks: transfer.remarks || 'Automated reconciliation of approved transfer request.',
          });
          migratedCount++;
        } else {
          skippedCount++;
        }
      } catch (itemErr) {
        console.error(`   ❌ Failed to process transfer ${transfer._id}:`, itemErr.message);
        errors.push({ transferId: transfer._id, error: itemErr.message });
      }
    }

    console.log(`✅ Transfer reconciliation finished. Processed: ${migratedCount}, Already Complete: ${skippedCount}, Errors: ${errors.length}`);
    return {
      total: approvedTransfers.length,
      migratedCount,
      skippedCount,
      errors,
    };
  } catch (error) {
    console.error('❌ Error during transfer reconciliation:', error);
    return {
      error: error.message,
    };
  }
};

module.exports = {
  completeTransferWorkflow,
  migrateApprovedTransfers,
};
