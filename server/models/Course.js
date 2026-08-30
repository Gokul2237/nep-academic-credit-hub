const mongoose = require('mongoose');

const COURSE_LEVELS = [
  'Undergraduate',
  'Postgraduate',
  'Doctoral',
  'Diploma',
  'Certificate',
  'Level 100',
  'Level 200',
  'Level 300',
  'Level 400',
];

const courseSchema = new mongoose.Schema(
  {
    courseCode: {
      type: String,
      required: [true, 'Course code is required (e.g. CS501)'],
      uppercase: true,
      trim: true,
      maxlength: [20, 'Course code cannot exceed 20 characters'],
    },
    courseName: {
      type: String,
      required: [true, 'Course name is required'],
      trim: true,
      maxlength: [150, 'Course name cannot exceed 150 characters'],
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    credits: {
      type: Number,
      required: [true, 'Credit value is required'],
      min: [1, 'Credits must be at least 1'],
      max: [20, 'Credits cannot exceed 20 per course'],
      validate: {
        validator: Number.isInteger,
        message: 'Credits must be an integer value',
      },
    },
    courseLevel: {
      type: String,
      enum: {
        values: COURSE_LEVELS,
        message: '{VALUE} is not a valid course level',
      },
      default: 'Undergraduate',
    },
    department: {
      type: String,
      required: [true, 'Department is required (e.g. Computer Science & Engineering)'],
      trim: true,
    },
    semester: {
      type: Number,
      required: [true, 'Semester is required (1-12)'],
      min: [1, 'Semester must be at least 1'],
      max: [12, 'Semester cannot exceed 12'],
    },
    institutionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Institution',
      required: [true, 'Course must belong to an institution'],
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index: A courseCode must be unique within a given institution
courseSchema.index({ institutionId: 1, courseCode: 1 }, { unique: true });

module.exports = {
  Course: mongoose.model('Course', courseSchema),
  COURSE_LEVELS,
};
