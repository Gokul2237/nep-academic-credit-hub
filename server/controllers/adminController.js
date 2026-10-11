const Institution = require('../models/Institution');
const { User, ROLES } = require('../models/User');
const { AcademicCredit } = require('../models/AcademicCredit');
const { Certificate } = require('../models/Certificate');
const { TransferRequest } = require('../models/TransferRequest');
const AuditLog = require('../models/AuditLog');
const ApiResponse = require('../utils/apiResponse');

/**
 * Get Admin Overview Statistics & Live DB Telemetry
 * GET /api/admin/overview
 */
const getAdminOverview = async (req, res) => {
  try {
    const [
      totalInstitutions,
      pendingInstitutionsCount,
      totalStudents,
      totalVerifiedCredits,
      totalCertificates,
      totalTransfers,
      pendingTransfersCount,
      pendingInstitutions,
      recentAuditLogs,
      recentTransfers,
    ] = await Promise.all([
      Institution.countDocuments(),
      Institution.countDocuments({ verificationStatus: 'PENDING' }),
      User.countDocuments({ role: ROLES.STUDENT, isActive: true }),
      AcademicCredit.countDocuments({ verificationStatus: 'verified' }),
      Certificate.countDocuments(),
      TransferRequest.countDocuments(),
      TransferRequest.countDocuments({
        status: { $in: ['PENDING', 'SUBMITTED', 'UNDER_REVIEW', 'IN_REVIEW'] },
      }),
      Institution.find({ verificationStatus: 'PENDING' })
        .select('_id name code type contactEmail naacAccreditation nirfRank verificationStatus createdAt')
        .lean(),
      AuditLog.find()
        .populate('userId', 'name email role')
        .populate('institutionId', 'name code')
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),
      TransferRequest.find()
        .populate('studentId', 'name email studentId')
        .populate('sourceInstitutionId', 'name code')
        .populate('destinationInstitutionId', 'name code')
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),
    ]);

    return ApiResponse.success(
      res,
      {
        totalInstitutions,
        pendingInstitutionsCount,
        totalStudents,
        totalVerifiedCredits,
        totalCertificates,
        totalTransfers,
        pendingTransfersCount,
        pendingInstitutions,
        recentAuditLogs,
        recentTransfers,
      },
      'Admin overview telemetry retrieved successfully'
    );
  } catch (error) {
    console.error('Get Admin Overview Error:', error);
    return ApiResponse.error(res, 'Failed to retrieve admin overview statistics.', 500);
  }
};

module.exports = {
  getAdminOverview,
};
