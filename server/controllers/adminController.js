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
      cumulativeCreditsAgg,
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
      AcademicCredit.aggregate([
        { $match: { verificationStatus: 'verified' } },
        { $group: { _id: null, totalPoints: { $sum: '$credits' } } },
      ]),
    ]);

    const totalCumulativePoints = cumulativeCreditsAgg[0]?.totalPoints || 0;

    return ApiResponse.success(
      res,
      {
        totalInstitutions,
        pendingInstitutionsCount,
        totalStudents,
        totalVerifiedCredits,
        totalCumulativePoints,
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

/**
 * Get Comprehensive Admin Analytics Summary
 * Calculates accurate macro metrics across 100% of the database records:
 * - System-wide totals (institutions, students, credit records, cumulative credit points, certificates)
 * - Institution-wise breakdown (enrolled students, issued credit records, cumulative credit points)
 * - Global credit verification status distribution
 * - Global academic grade distribution
 * GET /api/admin/analytics/summary
 */
const getAnalyticsSummary = async (req, res) => {
  try {
    const [
      institutions,
      studentAgg,
      creditAgg,
      statusAgg,
      gradeAgg,
      totalCertificates,
      totalStudents,
    ] = await Promise.all([
      Institution.find({ isActive: true })
        .select('_id name code type verificationStatus')
        .sort({ code: 1 })
        .lean(),
      User.aggregate([
        { $match: { role: ROLES.STUDENT, isActive: true } },
        { $group: { _id: '$institutionId', count: { $sum: 1 } } },
      ]),
      AcademicCredit.aggregate([
        {
          $group: {
            _id: '$institutionId',
            recordsCount: { $sum: 1 },
            totalPoints: { $sum: '$credits' },
            verifiedRecordsCount: {
              $sum: { $cond: [{ $eq: ['$verificationStatus', 'verified'] }, 1, 0] },
            },
            verifiedPoints: {
              $sum: { $cond: [{ $eq: ['$verificationStatus', 'verified'] }, '$credits', 0] },
            },
          },
        },
      ]),
      AcademicCredit.aggregate([
        { $group: { _id: '$verificationStatus', count: { $sum: 1 } } },
      ]),
      AcademicCredit.aggregate([
        { $match: { grade: { $exists: true, $ne: null } } },
        { $group: { _id: { $toUpper: '$grade' }, count: { $sum: 1 } } },
      ]),
      Certificate.countDocuments(),
      User.countDocuments({ role: ROLES.STUDENT, isActive: true }),
    ]);

    const studentMap = new Map(
      studentAgg.map((s) => [s._id ? s._id.toString() : null, s.count])
    );
    const creditMap = new Map(
      creditAgg.map((c) => [c._id ? c._id.toString() : null, c])
    );

    let totalCumulativePoints = 0;
    let totalCredits = 0;

    // Build institution breakdown using stable IDs, including institutions with 0 credits
    const instBreakdown = institutions.map((inst) => {
      const instIdStr = inst._id.toString();
      const sCount = studentMap.get(instIdStr) || 0;
      const cData = creditMap.get(instIdStr) || {
        recordsCount: 0,
        totalPoints: 0,
        verifiedRecordsCount: 0,
        verifiedPoints: 0,
      };

      totalCumulativePoints += cData.totalPoints;
      totalCredits += cData.recordsCount;

      return {
        _id: inst._id,
        name: inst.name,
        code: inst.code,
        type: inst.type,
        students: sCount,
        creditsCount: cData.recordsCount,
        totalPoints: cData.totalPoints,
        verifiedCreditsCount: cData.verifiedRecordsCount,
        verifiedPoints: cData.verifiedPoints,
      };
    });

    // Format Status Distribution for frontend Recharts
    const statusMap = new Map(statusAgg.map((s) => [s._id, s.count]));
    const verified = statusMap.get('verified') || 0;
    const pending = statusMap.get('pending') || 0;
    const rejected = statusMap.get('rejected') || 0;

    const statusDistribution = [
      {
        name: 'Verified',
        value: verified,
        color: '#10b981',
        percent: totalCredits > 0 ? Math.round((verified / totalCredits) * 100) : 0,
      },
      {
        name: 'Pending',
        value: pending,
        color: '#f59e0b',
        percent: totalCredits > 0 ? Math.round((pending / totalCredits) * 100) : 0,
      },
      {
        name: 'Rejected',
        value: rejected,
        color: '#f43f5e',
        percent: totalCredits > 0 ? Math.round((rejected / totalCredits) * 100) : 0,
      },
    ];

    // Format Grade Performance Distribution
    const gradeCounts = {};
    gradeAgg.forEach((g) => {
      if (g._id) {
        gradeCounts[g._id] = g.count;
      }
    });

    const gradeOrder = ['O', 'A+', 'A', 'B+', 'B', 'C', 'P'];
    const gradeDistribution = gradeOrder
      .filter((g) => gradeCounts[g] !== undefined)
      .map((g) => ({
        grade: g,
        count: gradeCounts[g] || 0,
      }));

    return ApiResponse.success(
      res,
      {
        totalInstitutions: institutions.length,
        totalStudents,
        totalCredits,
        totalCumulativePoints,
        totalCertificates,
        instBreakdown,
        statusDistribution,
        gradeDistribution,
      },
      'Admin analytics summary calculated successfully.'
    );
  } catch (error) {
    console.error('Get Analytics Summary Error:', error);
    return ApiResponse.error(res, 'Failed to calculate analytics summary.', 500);
  }
};

module.exports = {
  getAdminOverview,
  getAnalyticsSummary,
};
