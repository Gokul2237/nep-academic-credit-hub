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

module.exports = {
  getInstitutionOverview,
};
