const mongoose = require('mongoose');
const Institution = require('../models/Institution');
const { User, ROLES } = require('../models/User');
const { Course } = require('../models/Course');
const { AcademicCredit } = require('../models/AcademicCredit');
const { Certificate } = require('../models/Certificate');
const { TransferRequest } = require('../models/TransferRequest');
const APIKey = require('../models/APIKey');
const APILog = require('../models/APILog');
const AuditLog = require('../models/AuditLog');
const CreditPolicy = require('../models/CreditPolicy');
const ApiResponse = require('../utils/apiResponse');

/**
 * Get comprehensive overview statistics for the institution
 * GET /api/institution/overview or GET /api/v1/institution/overview
 * Access: Institution, Admin
 */
const getInstitutionOverview = async (req, res) => {
  try {
    let institutionId = null;

    if (req.user.role === ROLES.INSTITUTION) {
      institutionId = req.user.institutionId;
    } else if (req.user.role === ROLES.ADMIN) {
      institutionId = req.query.institutionId || req.user.institutionId;
    }

    if (!institutionId) {
      return ApiResponse.error(
        res,
        'Institution ID context is required to retrieve overview statistics.',
        400
      );
    }

    if (!mongoose.Types.ObjectId.isValid(institutionId)) {
      return ApiResponse.error(
        res,
        'Invalid Institution ID provided.',
        400
      );
    }

    const institutionObjId = new mongoose.Types.ObjectId(institutionId);

    // Run parallel aggregation and counts for maximum performance
    const [
      enrolledStudents,
      totalStudents,
      activeCourses,
      totalCourses,
      verifiedCreditsCount,
      pendingCreditsCount,
      totalCreditsCount,
      creditPointsAgg,
      transferredInCreditsCount,
      totalCertificates,
      verifiedCertificates,
      incomingTransfersTotal,
      incomingTransfersPending,
      incomingTransfersApproved,
      incomingTransfersRejected,
      outgoingTransfersTotal,
      outgoingTransfersPending,
      outgoingTransfersApproved,
      outgoingTransfersRejected,
      apiKeysTotal,
      apiKeysActive,
      apiLogsTotal,
      institutionProfile,
      recentTransfers,
      recentActivity,
    ] = await Promise.all([
      // 1. Enrolled students
      User.countDocuments({
        role: ROLES.STUDENT,
        institutionId: institutionObjId,
        isActive: true,
      }),
      // 2. Total students
      User.countDocuments({
        role: ROLES.STUDENT,
        institutionId: institutionObjId,
      }),
      // 3. Active Courses
      Course.countDocuments({
        institutionId: institutionObjId,
        isActive: true,
      }),
      // 4. Total Courses
      Course.countDocuments({
        institutionId: institutionObjId,
      }),
      // 5. Verified Credits Count
      AcademicCredit.countDocuments({
        institutionId: institutionObjId,
        verificationStatus: 'verified',
      }),
      // 6. Pending Credits Count
      AcademicCredit.countDocuments({
        institutionId: institutionObjId,
        verificationStatus: 'pending',
      }),
      // 7. Total Credits Count
      AcademicCredit.countDocuments({
        institutionId: institutionObjId,
      }),
      // 8. Total Credit Points Awarded
      AcademicCredit.aggregate([
        {
          $match: {
            institutionId: institutionObjId,
            verificationStatus: 'verified',
          },
        },
        {
          $group: {
            _id: null,
            totalPoints: { $sum: '$credits' },
          },
        },
      ]),
      // 9. Transferred-in Credits
      AcademicCredit.countDocuments({
        transferredTo: institutionObjId,
        isTransferred: true,
      }),
      // 10. Total Certificates
      Certificate.countDocuments({
        institutionId: institutionObjId,
      }),
      // 11. Verified Certificates
      Certificate.countDocuments({
        institutionId: institutionObjId,
        verificationStatus: 'verified',
      }),
      // 12. Incoming Transfers - Total
      TransferRequest.countDocuments({
        destinationInstitutionId: institutionObjId,
      }),
      // 13. Incoming Transfers - Pending
      TransferRequest.countDocuments({
        destinationInstitutionId: institutionObjId,
        status: { $in: ['PENDING', 'SUBMITTED', 'UNDER_REVIEW', 'IN_REVIEW'] },
      }),
      // 14. Incoming Transfers - Approved
      TransferRequest.countDocuments({
        destinationInstitutionId: institutionObjId,
        status: { $in: ['APPROVED', 'COMPLETED'] },
      }),
      // 15. Incoming Transfers - Rejected
      TransferRequest.countDocuments({
        destinationInstitutionId: institutionObjId,
        status: 'REJECTED',
      }),
      // 16. Outgoing Transfers - Total
      TransferRequest.countDocuments({
        sourceInstitutionId: institutionObjId,
      }),
      // 17. Outgoing Transfers - Pending
      TransferRequest.countDocuments({
        sourceInstitutionId: institutionObjId,
        status: { $in: ['PENDING', 'SUBMITTED', 'UNDER_REVIEW', 'IN_REVIEW'] },
      }),
      // 18. Outgoing Transfers - Approved
      TransferRequest.countDocuments({
        sourceInstitutionId: institutionObjId,
        status: { $in: ['APPROVED', 'COMPLETED'] },
      }),
      // 19. Outgoing Transfers - Rejected
      TransferRequest.countDocuments({
        sourceInstitutionId: institutionObjId,
        status: 'REJECTED',
      }),
      // 20. API Keys - Total
      APIKey.countDocuments({
        institutionId: institutionObjId,
      }),
      // 21. API Keys - Active
      APIKey.countDocuments({
        institutionId: institutionObjId,
        isActive: true,
      }),
      // 22. API Logs - Total
      APILog.countDocuments({
        institutionId: institutionObjId,
      }),
      // 23. Institution Profile
      Institution.findById(institutionObjId).select(
        'name code type contactEmail naacAccreditation nirfRank verificationStatus isActive'
      ),
      // 24. Recent Incoming Transfers
      TransferRequest.find({ destinationInstitutionId: institutionObjId })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('studentId', 'name email studentId')
        .populate('sourceInstitutionId', 'name code'),
      // 25. Recent Audit Activity
      AuditLog.find({ institutionId: institutionObjId })
        .sort({ createdAt: -1 })
        .limit(10)
        .populate('userId', 'name email role'),
    ]);

    const totalAwardedCreditPoints = creditPointsAgg[0]?.totalPoints || 0;

    const overviewData = {
      institutionId: institutionObjId,
      students: {
        enrolled: enrolledStudents,
        total: totalStudents,
      },
      courses: {
        active: activeCourses,
        total: totalCourses,
      },
      credits: {
        verifiedRecords: verifiedCreditsCount,
        pendingRecords: pendingCreditsCount,
        totalRecords: totalCreditsCount,
        totalPoints: totalAwardedCreditPoints,
        transferredIn: transferredInCreditsCount,
      },
      certificates: {
        total: totalCertificates,
        verified: verifiedCertificates,
      },
      transfers: {
        incoming: {
          total: incomingTransfersTotal,
          pending: incomingTransfersPending,
          approved: incomingTransfersApproved,
          rejected: incomingTransfersRejected,
        },
        outgoing: {
          total: outgoingTransfersTotal,
          pending: outgoingTransfersPending,
          approved: outgoingTransfersApproved,
          rejected: outgoingTransfersRejected,
        },
      },
      apiGateway: {
        totalKeys: apiKeysTotal,
        activeKeys: apiKeysActive,
        totalLogs: apiLogsTotal,
      },
      institutionProfile: institutionProfile || {
        _id: institutionObjId,
        name: req.user.institutionName || 'Unknown Institution',
        code: req.user.institutionCode || 'UNKNOWN',
        naacAccreditation: 'A+',
        nirfRank: null,
      },
      recentTransfers: recentTransfers || [],
      recentActivity: recentActivity || [],
    };

    return ApiResponse.success(
      res,
      overviewData,
      'Institution overview statistics retrieved successfully'
    );
  } catch (error) {
    console.error('getInstitutionOverview Error:', error);
    return ApiResponse.error(
      res,
      'Failed to retrieve institution overview statistics',
      500,
      error.message
    );
  }
};

/**
 * Get active credit acceptance policy and version history
 * GET /api/institution/policies
 * Access: Institution, Admin
 */
const getInstitutionPolicy = async (req, res) => {
  try {
    let institutionId = null;

    if (req.user.role === ROLES.INSTITUTION) {
      institutionId = req.user.institutionId;
    } else if (req.user.role === ROLES.ADMIN) {
      institutionId = req.query.institutionId || req.user.institutionId;
    }

    if (!institutionId) {
      return ApiResponse.error(
        res,
        'Institution context is required to retrieve credit policy.',
        400
      );
    }

    if (!mongoose.Types.ObjectId.isValid(institutionId)) {
      return ApiResponse.error(res, 'Invalid Institution ID.', 400);
    }

    const policy = await CreditPolicy.getEffectivePolicy(institutionId);

    return ApiResponse.success(
      res,
      policy,
      'Institutional credit acceptance policy retrieved successfully'
    );
  } catch (error) {
    console.error('getInstitutionPolicy Error:', error);
    return ApiResponse.error(
      res,
      'Failed to retrieve credit acceptance policy',
      500,
      error.message
    );
  }
};

/**
 * Update credit acceptance policy and publish new version
 * PUT /api/institution/policies
 * Access: Institution (own node only), Admin
 */
const updateInstitutionPolicy = async (req, res) => {
  try {
    let institutionId = null;

    if (req.user.role === ROLES.INSTITUTION) {
      institutionId = req.user.institutionId;
    } else if (req.user.role === ROLES.ADMIN) {
      institutionId = req.body.institutionId || req.user.institutionId;
    }

    if (!institutionId) {
      return ApiResponse.error(
        res,
        'Institution context is required to configure credit policy.',
        400
      );
    }

    if (!mongoose.Types.ObjectId.isValid(institutionId)) {
      return ApiResponse.error(res, 'Invalid Institution ID.', 400);
    }

    const { minGrade, minEquivalency, maxCredits, version, description } = req.body;

    // Server-side validation
    const validGrades = ['O', 'A+', 'A', 'B+', 'B', 'C', 'P'];
    if (minGrade && !validGrades.includes(minGrade.toUpperCase())) {
      return ApiResponse.error(
        res,
        `Invalid minimum grade. Allowed grades: ${validGrades.join(', ')}`,
        400
      );
    }

    const numEquiv = Number(minEquivalency);
    if (minEquivalency !== undefined && (isNaN(numEquiv) || numEquiv < 50 || numEquiv > 100)) {
      return ApiResponse.error(
        res,
        'Minimum equivalency must be a number between 50 and 100.',
        400
      );
    }

    const numMaxCredits = Number(maxCredits);
    if (maxCredits !== undefined && (isNaN(numMaxCredits) || numMaxCredits < 1 || numMaxCredits > 160)) {
      return ApiResponse.error(
        res,
        'Maximum cumulative transfer credits must be between 1 and 160.',
        400
      );
    }

    let policy = await CreditPolicy.findOne({ institutionId });

    if (!policy) {
      // First time saving
      const targetVersion = version?.trim() || 'v1.0';
      policy = new CreditPolicy({
        institutionId,
        version: targetVersion,
        minGrade: minGrade ? minGrade.toUpperCase() : 'B',
        minEquivalency: numEquiv || 80,
        maxCredits: numMaxCredits || 60,
        updatedBy: req.user._id,
        policyHistory: [
          {
            version: targetVersion,
            minGrade: minGrade ? minGrade.toUpperCase() : 'B',
            minEquivalency: numEquiv || 80,
            maxCredits: numMaxCredits || 60,
            updatedBy: req.user._id,
            updatedAt: new Date(),
            description: description || 'Initial custom credit acceptance policy configuration',
          },
        ],
      });
    } else {
      // Archive current version into history before updating
      policy.policyHistory.push({
        version: policy.version,
        minGrade: policy.minGrade,
        minEquivalency: policy.minEquivalency,
        maxCredits: policy.maxCredits,
        updatedBy: policy.updatedBy || req.user._id,
        updatedAt: policy.updatedAt || new Date(),
        description: `Archived prior to publishing ${version || 'next'} version`,
      });

      // Increment or set new version
      let nextVersion = version?.trim();
      if (!nextVersion) {
        const match = policy.version.match(/v?(\d+)(\.(\d+))?/);
        if (match) {
          const major = parseInt(match[1], 10);
          nextVersion = `v${major + 1}.0`;
        } else {
          nextVersion = `${policy.version}.1`;
        }
      }

      policy.version = nextVersion;
      if (minGrade) policy.minGrade = minGrade.toUpperCase();
      if (numEquiv) policy.minEquivalency = numEquiv;
      if (numMaxCredits) policy.maxCredits = numMaxCredits;
      policy.updatedBy = req.user._id;
    }

    await policy.save();

    // Create Immutable Audit Log
    AuditLog.create({
      logId: `LOG-POL-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      userId: req.user._id,
      institutionId,
      action: 'POLICY_VERSION_PUBLISHED',
      resource: `CreditPolicy:${policy._id}`,
      details: {
        institutionId,
        version: policy.version,
        minGrade: policy.minGrade,
        minEquivalency: policy.minEquivalency,
        maxCredits: policy.maxCredits,
      },
      ipAddress: req.ip || '127.0.0.1',
    }).catch((e) => console.error('AuditLog error in updateInstitutionPolicy:', e.message));

    return ApiResponse.success(
      res,
      policy,
      `Credit acceptance policy (${policy.version}) updated and published successfully`
    );
  } catch (error) {
    console.error('updateInstitutionPolicy Error:', error);
    return ApiResponse.error(
      res,
      'Failed to update credit acceptance policy',
      500,
      error.message
    );
  }
};

module.exports = {
  getInstitutionOverview,
  getInstitutionPolicy,
  updateInstitutionPolicy,
};
