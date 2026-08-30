const mongoose = require('mongoose');

const institutionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Institution name is required'],
      trim: true,
    },
    code: {
      type: String,
      required: [true, 'Institution code is required'],
      unique: true,
      uppercase: true,
      trim: true,
    },
    type: {
      type: String,
      enum: [
        'CENTRAL_UNIVERSITY',
        'STATE_UNIVERSITY',
        'DEEMED_UNIVERSITY',
        'AUTONOMOUS_COLLEGE',
        'PRIVATE_UNIVERSITY',
        'INSTITUTE_OF_NATIONAL_IMPORTANCE',
      ],
      default: 'STATE_UNIVERSITY',
    },
    contactEmail: {
      type: String,
      required: [true, 'Official contact email is required'],
      lowercase: true,
      trim: true,
    },
    naacAccreditation: {
      type: String,
      default: 'A+',
    },
    nirfRank: {
      type: Number,
      default: null,
    },
    verificationStatus: {
      type: String,
      enum: ['PENDING', 'VERIFIED', 'SUSPENDED'],
      default: 'VERIFIED', // Default verified for demo environments
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

module.exports = mongoose.model('Institution', institutionSchema);
