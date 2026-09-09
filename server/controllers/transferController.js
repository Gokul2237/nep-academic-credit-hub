const mongoose = require('mongoose');
const { TransferRequest } = require('../models/TransferRequest');
const { AcademicCredit } = require('../models/AcademicCredit');
const { User, ROLES } = require('../models/User');
const Institution = require('../models/Institution');
const ApiResponse = require('../utils/apiResponse');

/**
 * Initiate a new Credit Transfer Request
 * POST /api/transfers
 * Access: Student, Admin
 */
const createTransfer = async (req, res) => {
  try {
    const { destinationInstitutionId, creditIds, reason } = req.body;

    // 1. Resolve student
    let studentId = req.user._id;
    if (req.user.role === 'admin' && req.body.studentId) {
      studentId = req.body.studentId;
    }

    const student = await User.findById(studentId);
    if (!student || student.role !== ROLES.STUDENT) {
      return ApiResponse.error(res, 'Valid student record not found.', 404);
    }

    if (!student.institutionId) {
      return ApiResponse.error(
        res,
        'Student is not enrolled or associated with any home institution.',
        400
      );
    }

    // 2. Validate destination institution
    if (!destinationInstitutionId || !mongoose.Types.ObjectId.isValid(destinationInstitutionId)) {
      return ApiResponse.error(res, 'Valid destination institution ID is required.', 400);
    }

    const destinationInstitution = await Institution.findById(destinationInstitutionId);
    if (!destinationInstitution) {
      return ApiResponse.error(res, 'Destination institution does not exist.', 404);
    }

    if (destinationInstitution.verificationStatus !== 'VERIFIED') {
      return ApiResponse.error(
        res,
        'Selected destination institution is not officially verified.',
        400
      );
    }

    if (destinationInstitution.isActive === false) {
      return ApiResponse.error(
        res,
        'Selected destination institution is currently inactive.',
        400
      );
    }

    // Must be different from source institution
    if (destinationInstitution._id.toString() === student.institutionId.toString()) {
      return ApiResponse.error(
        res,
        'Destination institution cannot be the same as the student home institution.',
        400
      );
    }

    // 3. Validate creditIds array
    if (!Array.isArray(creditIds) || creditIds.length === 0) {
      return ApiResponse.error(
        res,
        'At least one academic credit must be selected for transfer.',
        400
      );
    }

    for (const id of creditIds) {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return ApiResponse.error(res, `Invalid credit ID format: ${id}`, 400);
      }
    }

    // 4. Resolve selected credit records
    const credits = await AcademicCredit.find({ _id: { $in: creditIds } });
    if (credits.length !== creditIds.length) {
      return ApiResponse.error(
        res,
        'One or more selected academic credits could not be found.',
        404
      );
    }

    // 5. Verify credit ownership and verified status
    let totalCredits = 0;
    for (const credit of credits) {
      if (credit.studentId.toString() !== student._id.toString()) {
        return ApiResponse.error(
          res,
          'Access denied: You cannot transfer academic credits belonging to another student.',
          403
        );
      }

      if (credit.verificationStatus !== 'verified') {
        return ApiResponse.error(
          res,
          `Credit for course ID ${credit.courseId} is '${credit.verificationStatus}'. Only verified credits can be transferred.`,
          400
        );
      }

      totalCredits += credit.credits;
    }

    // 6. Prevent duplicate / concurrent active transfer requests for the same credits
    const activeTransferConflict = await TransferRequest.findOne({
      creditIds: { $in: creditIds },
      status: { $in: ['PENDING', 'SUBMITTED', 'UNDER_REVIEW', 'IN_REVIEW', 'APPROVED', 'CONDITIONAL_APPROVAL'] },
    });

    if (activeTransferConflict) {
      return ApiResponse.error(
        res,
        'One or more selected credits are already part of an active or approved transfer request.',
        409
      );
    }

    // 7. Create transfer request
    const newTransfer = await TransferRequest.create({
      studentId: student._id,
      sourceInstitutionId: student.institutionId,
      destinationInstitutionId: destinationInstitution._id,
      creditIds,
      totalCredits,
      reason: (reason || '').trim(),
      status: 'PENDING',
    });

    const populatedTransfer = await TransferRequest.findById(newTransfer._id)
      .populate('studentId', 'name email studentId')
      .populate('sourceInstitutionId', 'name code type')
      .populate('destinationInstitutionId', 'name code type')
      .populate({
        path: 'creditIds',
        populate: {
          path: 'courseId',
          select: 'courseCode courseName credits department',
        },
      });

    return ApiResponse.created(
      res,
      populatedTransfer,
      'Academic credit transfer request submitted successfully.'
    );
  } catch (error) {
    console.error('Create Transfer Error:', error);
    return ApiResponse.error(res, error.message || 'Failed to initiate credit transfer.', 500);
  }
};

/**
 * Get Transfer Requests
 * GET /api/transfers
 * Access: Scoped per role
 */
const getTransfers = async (req, res) => {
  try {
    const { status, type, page = 1, limit = 50 } = req.query;
    const query = {};

    // Role-based filtering
    if (req.user.role === 'student') {
      // Students only see their own transfer requests
      query.studentId = req.user._id;
    } else if (req.user.role === 'institution') {
      const instId = req.user.institutionId;
      if (!instId) {
        return ApiResponse.error(res, 'User is not linked to any institution node.', 400);
      }

      if (type === 'outgoing') {
        query.sourceInstitutionId = instId;
      } else if (type === 'all') {
        query.$or = [{ destinationInstitutionId: instId }, { sourceInstitutionId: instId }];
      } else {
        // Default: incoming requests directed to this institution for evaluation
        query.destinationInstitutionId = instId;
      }
    } else if (req.user.role === 'admin') {
      if (req.query.studentId) query.studentId = req.query.studentId;
      if (req.query.destinationInstitutionId) query.destinationInstitutionId = req.query.destinationInstitutionId;
      if (req.query.sourceInstitutionId) query.sourceInstitutionId = req.query.sourceInstitutionId;
    }

    if (status) {
      query.status = status.toUpperCase();
    }

    const skip = (Number(page) - 1) * Number(limit);
    const total = await TransferRequest.countDocuments(query);
    const transfers = await TransferRequest.find(query)
      .populate('studentId', 'name email studentId')
      .populate('sourceInstitutionId', 'name code type')
      .populate('destinationInstitutionId', 'name code type')
      .populate({
        path: 'creditIds',
        populate: {
          path: 'courseId',
          select: 'courseCode courseName credits department courseLevel',
        },
      })
      .populate('reviewedBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    return ApiResponse.paginated(
      res,
      transfers,
      total,
      page,
      limit,
      'Transfer requests retrieved successfully.'
    );
  } catch (error) {
    console.error('Get Transfers Error:', error);
    return ApiResponse.error(res, 'Failed to fetch credit transfer requests.', 500);
  }
};

/**
 * Get Transfer Request by ID
 * GET /api/transfers/:id
 */
const getTransferById = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return ApiResponse.error(res, 'Invalid transfer request ID format.', 400);
    }

    const transfer = await TransferRequest.findById(req.params.id)
      .populate('studentId', 'name email studentId')
      .populate('sourceInstitutionId', 'name code type contactEmail')
      .populate('destinationInstitutionId', 'name code type contactEmail')
      .populate({
        path: 'creditIds',
        populate: {
          path: 'courseId',
          select: 'courseCode courseName credits department courseLevel',
        },
      })
      .populate('reviewedBy', 'name email');

    if (!transfer) {
      return ApiResponse.error(res, 'Transfer request not found.', 404);
    }

    // Role-based access check
    if (
      req.user.role === 'student' &&
      transfer.studentId._id.toString() !== req.user._id.toString()
    ) {
      return ApiResponse.error(
        res,
        'Access denied: You can only view your own transfer requests.',
        403
      );
    }

    if (req.user.role === 'institution') {
      const instId = req.user.institutionId?.toString();
      const isDestination = transfer.destinationInstitutionId?._id?.toString() === instId;
      const isSource = transfer.sourceInstitutionId?._id?.toString() === instId;

      if (!isDestination && !isSource) {
        return ApiResponse.error(
          res,
          'Access denied: Your institution is neither the source nor destination of this transfer request.',
          403
        );
      }
    }

    return ApiResponse.success(res, transfer, 'Transfer request details retrieved successfully.');
  } catch (error) {
    console.error('Get Transfer By ID Error:', error);
    return ApiResponse.error(res, 'Failed to fetch transfer request details.', 500);
  }
};

/**
 * Review / Evaluate Transfer Request (Approve or Reject)
 * PUT /api/transfers/:id/review
 * Access: Destination Institution, Admin
 */
const reviewTransfer = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return ApiResponse.error(res, 'Invalid transfer request ID format.', 400);
    }

    const transfer = await TransferRequest.findById(req.params.id);
    if (!transfer) {
      return ApiResponse.error(res, 'Transfer request not found.', 404);
    }

    // Strict Tenant Check: Only destination institution (or admin) can evaluate incoming requests
    if (req.user.role === 'institution') {
      if (
        !req.user.institutionId ||
        transfer.destinationInstitutionId.toString() !== req.user.institutionId.toString()
      ) {
        return ApiResponse.error(
          res,
          'Access denied: Only the destination institution can review and decide on this transfer request.',
          403
        );
      }
    }

    // Prevent changing state of finalized requests
    const finalizedStatuses = ['APPROVED', 'REJECTED', 'CANCELLED', 'COMPLETED'];
    if (finalizedStatuses.includes(transfer.status)) {
      return ApiResponse.error(
        res,
        `Cannot review a transfer request that is already ${transfer.status}.`,
        400
      );
    }

    const { status, remarks, rejectionReason } = req.body;
    const allowedReviewStatuses = ['APPROVED', 'REJECTED', 'UNDER_REVIEW', 'CONDITIONAL_APPROVAL'];

    const targetStatus = (status || '').toUpperCase();
    if (!allowedReviewStatuses.includes(targetStatus)) {
      return ApiResponse.error(
        res,
        `Invalid status. Allowed review statuses: ${allowedReviewStatuses.join(', ')}`,
        400
      );
    }

    transfer.status = targetStatus;
    if (remarks) transfer.remarks = remarks.trim();
    if (rejectionReason) transfer.rejectionReason = rejectionReason.trim();

    if (['APPROVED', 'REJECTED', 'CONDITIONAL_APPROVAL'].includes(targetStatus)) {
      transfer.reviewedBy = req.user._id;
      transfer.reviewedAt = new Date();
    }

    await transfer.save();

    const updatedTransfer = await TransferRequest.findById(transfer._id)
      .populate('studentId', 'name email studentId')
      .populate('sourceInstitutionId', 'name code type')
      .populate('destinationInstitutionId', 'name code type')
      .populate({
        path: 'creditIds',
        populate: {
          path: 'courseId',
          select: 'courseCode courseName credits department',
        },
      })
      .populate('reviewedBy', 'name email');

    return ApiResponse.success(
      res,
      updatedTransfer,
      `Transfer request has been successfully updated to ${targetStatus}.`
    );
  } catch (error) {
    console.error('Review Transfer Error:', error);
    return ApiResponse.error(res, error.message || 'Failed to review transfer request.', 500);
  }
};

/**
 * Cancel Transfer Request
 * PUT /api/transfers/:id/cancel
 * Access: Student (owner), Admin
 */
const cancelTransfer = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return ApiResponse.error(res, 'Invalid transfer request ID format.', 400);
    }

    const transfer = await TransferRequest.findById(req.params.id);
    if (!transfer) {
      return ApiResponse.error(res, 'Transfer request not found.', 404);
    }

    // Role check: Student can only cancel their own
    if (
      req.user.role === 'student' &&
      transfer.studentId.toString() !== req.user._id.toString()
    ) {
      return ApiResponse.error(
        res,
        'Access denied: You can only cancel your own transfer requests.',
        403
      );
    }

    const cancellableStatuses = ['PENDING', 'SUBMITTED', 'UNDER_REVIEW', 'IN_REVIEW'];
    if (!cancellableStatuses.includes(transfer.status)) {
      return ApiResponse.error(
        res,
        `Cannot cancel transfer request with status '${transfer.status}'. Only pending or in-review requests can be cancelled.`,
        400
      );
    }

    transfer.status = 'CANCELLED';
    await transfer.save();

    return ApiResponse.success(
      res,
      transfer,
      'Credit transfer request cancelled successfully.'
    );
  } catch (error) {
    console.error('Cancel Transfer Error:', error);
    return ApiResponse.error(res, 'Failed to cancel transfer request.', 500);
  }
};

/**
 * Get Transfer Statistics
 * GET /api/transfers/stats
 */
const getTransferStats = async (req, res) => {
  try {
    const filter = {};
    if (req.user.role === 'student') {
      filter.studentId = req.user._id;
    } else if (req.user.role === 'institution') {
      const instId = req.user.institutionId;
      filter.$or = [{ destinationInstitutionId: instId }, { sourceInstitutionId: instId }];
    }

    const [total, pending, approved, rejected, cancelled] = await Promise.all([
      TransferRequest.countDocuments(filter),
      TransferRequest.countDocuments({ ...filter, status: { $in: ['PENDING', 'SUBMITTED', 'UNDER_REVIEW', 'IN_REVIEW'] } }),
      TransferRequest.countDocuments({ ...filter, status: { $in: ['APPROVED', 'CONDITIONAL_APPROVAL', 'COMPLETED'] } }),
      TransferRequest.countDocuments({ ...filter, status: 'REJECTED' }),
      TransferRequest.countDocuments({ ...filter, status: 'CANCELLED' }),
    ]);

    return ApiResponse.success(
      res,
      {
        total,
        pending,
        approved,
        rejected,
        cancelled,
      },
      'Transfer statistics retrieved successfully.'
    );
  } catch (error) {
    console.error('Transfer Stats Error:', error);
    return ApiResponse.error(res, 'Failed to retrieve transfer statistics.', 500);
  }
};

module.exports = {
  createTransfer,
  getTransfers,
  getTransferById,
  reviewTransfer,
  cancelTransfer,
  getTransferStats,
};
