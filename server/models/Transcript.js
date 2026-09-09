const mongoose = require('mongoose');

const TRANSCRIPT_STATUSES = [
  'draft',
  'generated',
  'verified',
  'revoked',
];

const transcriptSchema = new mongoose.Schema(
  {
    transcriptId: {
      type: String,
      required: [true, 'Transcript ID is required'],
      unique: true,
      trim: true,
      index: true,
    },

    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Student reference is required'],
      index: true,
    },

    institutionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Institution',
      required: [true, 'Institution reference is required'],
      index: true,
    },

    transcriptType: {
      type: String,
      enum: ['official', 'unofficial'],
      default: 'official',
    },

    status: {
      type: String,
      enum: TRANSCRIPT_STATUSES,
      default: 'generated',
      index: true,
    },

    generatedAt: {
      type: Date,
      default: Date.now,
    },

    generatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    totalCredits: {
      type: Number,
      min: 0,
      default: 0,
    },

    verifiedCredits: {
      type: Number,
      min: 0,
      default: 0,
    },

    creditRecordCount: {
      type: Number,
      min: 0,
      default: 0,
    },

    integrityHash: {
      type: String,
      required: [true, 'Transcript integrity hash is required'],
      trim: true,
    },

    documentUrl: {
      type: String,
      trim: true,
      default: '',
    },

    verificationCode: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      index: true,
    },

    revokedAt: {
      type: Date,
      default: null,
    },

    revocationReason: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Student transcript history
transcriptSchema.index({
  studentId: 1,
  createdAt: -1,
});

// Institution transcript history
transcriptSchema.index({
  institutionId: 1,
  status: 1,
});

const Transcript = mongoose.model('Transcript', transcriptSchema);

module.exports = {
  Transcript,
  TRANSCRIPT_STATUSES,
};