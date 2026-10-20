const mongoose = require('mongoose');

const VALID_GRADES = ['O', 'A+', 'A', 'B+', 'B', 'C', 'P', 'F'];
const RESULT_STATUSES = ['PASS', 'FAIL', 'PENDING'];

const correctionHistorySchema = new mongoose.Schema(
  {
    previousMarks: { type: Number },
    previousGrade: { type: String, uppercase: true },
    previousCredits: { type: Number },
    previousStatus: { type: String },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedAt: { type: Date, default: Date.now },
    reason: { type: String, trim: true },
  },
  { _id: false }
);

const semesterResultSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Student reference is required'],
      index: true,
    },
    studentAbcId: {
      type: String,
      required: [true, 'Student ABC ID is required'],
      trim: true,
      index: true,
    },
    institutionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Institution',
      required: [true, 'Institution reference is required'],
      index: true,
    },
    academicYear: {
      type: String,
      required: [true, 'Academic year is required (e.g. 2024-25)'],
      trim: true,
    },
    semester: {
      type: Number,
      required: [true, 'Semester is required (1-12)'],
      min: [1, 'Semester must be at least 1'],
      max: [12, 'Semester cannot exceed 12'],
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: [true, 'Course reference is required'],
      index: true,
    },
    courseCode: {
      type: String,
      required: [true, 'Course code is required'],
      uppercase: true,
      trim: true,
    },
    marks: {
      type: Number,
      min: [0, 'Marks cannot be negative'],
      max: [100, 'Marks cannot exceed 100'],
      default: null,
    },
    grade: {
      type: String,
      required: [true, 'Grade is required'],
      uppercase: true,
      trim: true,
      enum: {
        values: VALID_GRADES,
        message: '{VALUE} is not a valid grade',
      },
    },
    creditsEarned: {
      type: Number,
      default: 0,
      min: 0,
      max: 20,
    },
    resultStatus: {
      type: String,
      enum: RESULT_STATUSES,
      default: 'PASS',
      uppercase: true,
    },
    importBatchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ResultImportBatch',
      default: null,
      index: true,
    },
    creditId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AcademicCredit',
      default: null,
    },
    attemptNumber: {
      type: Number,
      default: 1,
    },
    isCorrected: {
      type: Boolean,
      default: false,
    },
    correctionHistory: [correctionHistorySchema],
  },
  {
    timestamps: true,
  }
);

// Compound index: Prevent duplicate result entries for student + course + academicYear + semester
semesterResultSchema.index(
  { studentId: 1, courseId: 1, academicYear: 1, semester: 1 },
  { unique: true }
);

semesterResultSchema.index({ institutionId: 1, academicYear: 1, semester: 1 });
semesterResultSchema.index({ studentAbcId: 1, semester: 1 });

module.exports = {
  SemesterResult: mongoose.model('SemesterResult', semesterResultSchema),
  VALID_GRADES,
  RESULT_STATUSES,
};
