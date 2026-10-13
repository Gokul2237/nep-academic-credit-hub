const mongoose = require('mongoose');

const policyHistorySchema = new mongoose.Schema(
  {
    version: {
      type: String,
      required: true,
      trim: true,
    },
    minGrade: {
      type: String,
      required: true,
      trim: true,
    },
    minEquivalency: {
      type: Number,
      required: true,
    },
    maxCredits: {
      type: Number,
      required: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
  },
  { _id: false }
);

const creditPolicySchema = new mongoose.Schema(
  {
    institutionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Institution',
      required: [true, 'Institution reference is required for credit policy'],
      unique: true,
      index: true,
    },
    version: {
      type: String,
      default: 'v1.0',
      trim: true,
    },
    minGrade: {
      type: String,
      enum: ['O', 'A+', 'A', 'B+', 'B', 'C', 'P'],
      default: 'B',
      trim: true,
    },
    minEquivalency: {
      type: Number,
      min: [50, 'Minimum equivalency must be at least 50%'],
      max: [100, 'Minimum equivalency cannot exceed 100%'],
      default: 80,
    },
    maxCredits: {
      type: Number,
      min: [1, 'Maximum transferable credits must be at least 1'],
      max: [160, 'Maximum transferable credits cannot exceed 160'],
      default: 60,
    },
    policyHistory: [policyHistorySchema],
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Helper static to fetch active policy for institution or get default configuration
creditPolicySchema.statics.getEffectivePolicy = async function (institutionId) {
  if (!institutionId) {
    return {
      version: 'v1.0',
      minGrade: 'B',
      minEquivalency: 80,
      maxCredits: 60,
      policyHistory: [],
    };
  }

  const policy = await this.findOne({ institutionId });
  if (policy) {
    return policy;
  }

  // Return clean default configuration if not customized
  return {
    institutionId,
    version: 'v1.0',
    minGrade: 'B',
    minEquivalency: 80,
    maxCredits: 60,
    policyHistory: [
      {
        version: 'v1.0',
        minGrade: 'B',
        minEquivalency: 80,
        maxCredits: 60,
        updatedAt: new Date(),
        description: 'Initial NEP 2020 baseline credit acceptance policy',
      },
    ],
  };
};

const CreditPolicy = mongoose.model('CreditPolicy', creditPolicySchema);

module.exports = CreditPolicy;
