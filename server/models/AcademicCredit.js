const mongoose = require('mongoose');
const { generateCreditHash } = require('../utils/hashHelper');

const VERIFICATION_STATUSES = ['pending', 'verified', 'rejected'];
const SOURCE_TYPES = ['institution', 'manual', 'api'];
const VALID_GRADES = ['O', 'A+', 'A', 'B+', 'B', 'C', 'P', 'F'];

const academicCreditSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Student reference is required'],
      index: true,
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: [true, 'Course reference is required'],
      index: true,
    },
    institutionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Institution',
      required: [true, 'Awarding Institution reference is required'],
      index: true,
    },
    credits: {
      type: Number,
      required: [true, 'Credit value is required'],
      min: [1, 'Credits must be at least 1'],
      max: [20, 'Credits cannot exceed 20'],
      validate: {
        validator: Number.isInteger,
        message: 'Credits must be an integer value',
      },
    },
    grade: {
      type: String,
      required: [true, 'Grade is required (e.g. A+, O, A, B)'],
      uppercase: true,
      trim: true,
      enum: {
        values: VALID_GRADES,
        message: '{VALUE} is not a recognized grade',
      },
    },
    semester: {
      type: Number,
      required: [true, 'Semester is required (1-12)'],
      min: [1, 'Semester must be at least 1'],
      max: [12, 'Semester cannot exceed 12'],
    },
    academicYear: {
      type: String,
      required: [true, 'Academic year is required (e.g. 2025-26)'],
      trim: true,
    },
    awardDate: {
      type: Date,
      default: Date.now,
    },
    verificationStatus: {
      type: String,
      enum: {
        values: VERIFICATION_STATUSES,
        message: '{VALUE} is not a valid verification status',
      },
      default: 'pending',
      index: true,
    },
    sourceType: {
      type: String,
      enum: {
        values: SOURCE_TYPES,
        message: '{VALUE} is not a valid source type',
      },
      default: 'institution',
    },
    integrityHash: {
      type: String,
      required: [true, 'Credit integrity hash is required'],
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
    isTransferred: {
      type: Boolean,
      default: false,
      index: true,
    },
    transferredTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Institution',
      default: null,
      index: true,
    },
    transferRequestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TransferRequest',
      default: null,
    },
    transferredAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index: Prevent duplicate credit records for the same student + course + academic year + semester
academicCreditSchema.index(
  { studentId: 1, courseId: 1, academicYear: 1, semester: 1 },
  { unique: true }
);

// Pre-save hook: Ensure integrity hash is computed and up-to-date
academicCreditSchema.pre('validate', function (next) {
  if (this.isModified('credits') || this.isModified('grade') || !this.integrityHash) {
    this.integrityHash = generateCreditHash({
      studentId: this.studentId,
      courseId: this.courseId,
      institutionId: this.institutionId,
      credits: this.credits,
      grade: this.grade,
      semester: this.semester,
      academicYear: this.academicYear,
    });
  }
  next();
});

module.exports = {
  AcademicCredit: mongoose.model('AcademicCredit', academicCreditSchema),
  VERIFICATION_STATUSES,
  SOURCE_TYPES,
  VALID_GRADES,
};
