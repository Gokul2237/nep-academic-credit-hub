const mongoose = require('mongoose');

const TRANSFER_STATUSES = [
  'PENDING',
  'SUBMITTED',
  'UNDER_REVIEW',
  'IN_REVIEW',
  'APPROVED',
  'CONDITIONAL_APPROVAL',
  'REJECTED',
  'COMPLETED',
  'CANCELLED',
];

const transferRequestSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Student reference is required'],
      index: true,
    },
    sourceInstitutionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Institution',
      required: [true, 'Source institution reference is required'],
      index: true,
    },
    destinationInstitutionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Institution',
      required: [true, 'Destination institution reference is required'],
      index: true,
    },
    creditIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AcademicCredit',
        required: true,
      },
    ],
    totalCredits: {
      type: Number,
      required: [true, 'Total credits value is required'],
      min: [1, 'Total credits must be at least 1'],
    },
    status: {
      type: String,
      enum: {
        values: TRANSFER_STATUSES,
        message: '{VALUE} is not a valid transfer request status',
      },
      default: 'PENDING',
      uppercase: true,
      index: true,
    },
    reason: {
      type: String,
      trim: true,
      default: '',
    },
    policyVersionUsed: {
      type: String,
      trim: true,
      default: '1.0',
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
    remarks: {
      type: String,
      trim: true,
      default: '',
    },
    rejectionReason: {
      type: String,
      trim: true,
      default: '',
    },
    completedAt: {
      type: Date,
      default: null,
    },
    completedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    completionDetails: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for performant queries
transferRequestSchema.index({ studentId: 1, status: 1 });
transferRequestSchema.index({ destinationInstitutionId: 1, status: 1 });
transferRequestSchema.index({ sourceInstitutionId: 1, status: 1 });
transferRequestSchema.index({ creditIds: 1 });

const TransferRequest = mongoose.model('TransferRequest', transferRequestSchema);

module.exports = {
  TransferRequest,
  TRANSFER_STATUSES,
};
