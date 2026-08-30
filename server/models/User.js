const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const ROLES = {
  STUDENT: 'student',
  INSTITUTION: 'institution',
  ADMIN: 'admin',
};

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email address is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,})+$/,
        'Please provide a valid email address',
      ],
    },
    passwordHash: {
      type: String,
      required: [true, 'Password hash is required'],
      minlength: [6, 'Password must be at least 6 characters'],
    },
    role: {
      type: String,
      enum: {
        values: [ROLES.STUDENT, ROLES.INSTITUTION, ROLES.ADMIN],
        message: '{VALUE} is not a supported user role',
      },
      default: ROLES.STUDENT,
      required: true,
    },
    studentId: {
      type: String,
      trim: true,
      default: null,
      // ABC (Academic Bank of Credits) ID or Student Roll Number
    },
    institutionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Institution',
      default: null,
    },
    institutionCode: {
      type: String,
      trim: true,
      uppercase: true,
      default: null,
    },
    institutionName: {
      type: String,
      trim: true,
      default: null,
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

// Encrypt password using bcrypt before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('passwordHash')) {
    return next();
  }
  const salt = await bcrypt.genSalt(12);
  this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
  next();
});

// Instance method to compare password during login
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.passwordHash);
};

// Remove passwordHash from JSON transformations
userSchema.methods.toJSON = function () {
  const userObject = this.toObject();
  delete userObject.passwordHash;
  delete userObject.__v;
  return userObject;
};

module.exports = {
  User: mongoose.model('User', userSchema),
  ROLES,
};
