const mongoose = require('mongoose');

const CERTIFICATE_STATUSES = [
  'pending',
  'verified',
  'rejected',
  'revoked',
];

const CERTIFICATE_TYPES = [
  'course_completion',
  'academic_achievement',
  'skill',
  'participation',
  'other',
];

const certificateSchema = new mongoose.Schema(
  {
    certificateId: {
      type: String,
      required: [true, 'Certificate ID is required'],
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
      required: [true, 'Issuing institution reference is required'],
      index: true,
    },

    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: [true, 'Course reference is required'],
      index: true,
    },

   academicCreditId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'AcademicCredit',
  required: [true, 'Academic credit reference is required'],
},

    title: {
      type: String,
      required: [true, 'Certificate title is required'],
      trim: true,
      maxlength: [200, 'Certificate title cannot exceed 200 characters'],
    },

    certificateType: {
      type: String,
      enum: {
        values: CERTIFICATE_TYPES,
        message: '{VALUE} is not a valid certificate type',
      },
      default: 'course_completion',
    },

    issueDate: {
      type: Date,
      default: Date.now,
    },

    documentUrl: {
      type: String,
      trim: true,
      default: '',
    },

    integrityHash: {
      type: String,
      required: [true, 'Certificate integrity hash is required'],
      trim: true,
    },

    verificationStatus: {
      type: String,
      enum: {
        values: CERTIFICATE_STATUSES,
        message: '{VALUE} is not a valid certificate status',
      },
      default: 'pending',
      index: true,
    },

    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    verifiedAt: {
      type: Date,
      default: null,
    },

    rejectionReason: {
      type: String,
      trim: true,
      default: '',
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

// Prevent multiple certificates for the same academic credit.
certificateSchema.index(
  { academicCreditId: 1 },
  { unique: true }
);

// Useful for student certificate history.
certificateSchema.index({
  studentId: 1,
  verificationStatus: 1,
});

const Certificate = mongoose.model('Certificate', certificateSchema);

module.exports = {
  Certificate,
  CERTIFICATE_STATUSES,
  CERTIFICATE_TYPES,
};