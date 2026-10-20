const mongoose = require('mongoose');

const BATCH_STATUSES = ['PREVIEW', 'CONFIRMED', 'FAILED', 'PARTIALLY_PROCESSED'];

const rowErrorSchema = new mongoose.Schema(
  {
    rowNumber: { type: Number },
    studentAbcId: { type: String, default: '' },
    courseCode: { type: String, default: '' },
    reason: { type: String, required: true },
  },
  { _id: false }
);

const batchItemSchema = new mongoose.Schema(
  {
    rowNumber: { type: Number },
    studentAbcId: { type: String },
    studentName: { type: String },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    courseCode: { type: String },
    courseName: { type: String },
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
    credits: { type: Number },
    marks: { type: Number },
    grade: { type: String },
    resultStatus: { type: String },
    eligibleCredits: { type: Number },
    isValid: { type: Boolean, default: true },
    isDuplicateInFile: { type: Boolean, default: false },
    isAlreadyProcessed: { type: Boolean, default: false },
    rejectionReason: { type: String, default: null },
    alreadyExistsReason: { type: String, default: null },
  },
  { _id: false }
);

const resultImportBatchSchema = new mongoose.Schema(
  {
    batchId: {
      type: String,
      required: [true, 'Batch ID is required'],
      unique: true,
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
      required: [true, 'Academic year is required'],
      trim: true,
    },
    semester: {
      type: Number,
      required: [true, 'Semester is required'],
      min: 1,
      max: 12,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Uploader reference is required'],
    },
    originalFileName: {
      type: String,
      default: '',
    },
    fileSize: {
      type: Number,
      default: 0,
    },
    totalRows: {
      type: Number,
      default: 0,
    },
    validRows: {
      type: Number,
      default: 0,
    },
    invalidRows: {
      type: Number,
      default: 0,
    },
    duplicateRows: {
      type: Number,
      default: 0,
    },
    previouslyProcessedRows: {
      type: Number,
      default: 0,
    },
    processedRows: {
      type: Number,
      default: 0,
    },
    creditsAwarded: {
      type: Number,
      default: 0,
    },
    studentsAdvanced: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: BATCH_STATUSES,
      default: 'PREVIEW',
      index: true,
    },
    errors: [rowErrorSchema],
    items: [batchItemSchema],
  },
  {
    timestamps: true,
    suppressReservedKeysWarning: true,
  }
);

resultImportBatchSchema.index({ institutionId: 1, createdAt: -1 });

module.exports = {
  ResultImportBatch: mongoose.model('ResultImportBatch', resultImportBatchSchema),
  BATCH_STATUSES,
};
