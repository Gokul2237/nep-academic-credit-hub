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
      required: [true, 'Name is required'],
      trim: true,
      minlength: 2,
      maxlength: 100,
    },

    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        'Please provide a valid email address',
      ],
    },

    passwordHash: {
      type: String,
      required: [true, 'Password is required'],
      select: false,
    },

    role: {
      type: String,
      enum: Object.values(ROLES),
      default: ROLES.STUDENT,
      required: true,
      index: true,
    },

    /*
     * Student's ABC ID / Roll Number
     */
    studentId: {
      type: String,
      trim: true,
      sparse: true,
      index: true,
    },

    /*
     * Institution associated with the user.
     *
     * For students:
     *   This identifies the institution where the student belongs.
     *
     * For institution users:
     *   This identifies their institution node.
     *
     * For admins:
     *   null.
     */
    institutionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Institution',
      default: null,
      index: true,
    },

    /*
     * Cached institution information.
     * These make the UI/API responses convenient while
     * institutionId remains the actual relationship.
     */
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
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

/*
 * Hash password before saving.
 *
 * IMPORTANT:
 * Plain-text passwords are never stored.
 *
 * If passwordHash is already a bcrypt hash and hasn't changed,
 * don't hash it again.
 */
userSchema.pre('save', async function (next) {
  try {
    if (!this.isModified('passwordHash')) {
      return next();
    }

    /*
     * bcrypt hashes normally start with $2a$, $2b$ or $2y$.
     * If an already-hashed value is passed while updating,
     * avoid hashing it a second time.
     */
    if (
      typeof this.passwordHash === 'string' &&
      /^\$2[aby]\$\d{2}\$/.test(this.passwordHash)
    ) {
      return next();
    }

    const salt = await bcrypt.genSalt(12);

    this.passwordHash = await bcrypt.hash(this.passwordHash, salt);

    next();
  } catch (error) {
    next(error);
  }
});

/*
 * Compare supplied password with stored bcrypt hash.
 */
userSchema.methods.comparePassword = async function (candidatePassword) {
  /*
   * Because passwordHash has select:false,
   * explicitly fetch it when necessary.
   *
   * Normally login controller should query using:
   * .select('+passwordHash')
   */
  const userWithPassword = await this.constructor
    .findById(this._id)
    .select('+passwordHash');

  if (!userWithPassword || !userWithPassword.passwordHash) {
    return false;
  }

  return bcrypt.compare(
    candidatePassword,
    userWithPassword.passwordHash
  );
};

/*
 * Never expose passwordHash in API responses.
 */
userSchema.methods.toJSON = function () {
  const user = this.toObject();

  delete user.passwordHash;
  delete user.__v;

  return user;
};

/*
 * Useful indexes for institution-scoped queries.
 */
userSchema.index({
  institutionId: 1,
  role: 1,
});

userSchema.index({
  institutionId: 1,
  studentId: 1,
});

const User = mongoose.model('User', userSchema);

module.exports = {
  User,
  ROLES,
};