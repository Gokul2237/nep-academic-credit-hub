const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

const { User, ROLES } = require('../models/User');
const { authenticate } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const ApiResponse = require('../utils/apiResponse');

// ============================================================
// GET /api/students
// ============================================================
// Institution:
//   Returns students belonging strictly to the logged-in institution.
//
// Admin:
//   Returns all active students.
//
// Students:
//   Forbidden (403).
// ============================================================

router.get(
  '/',
  authenticate,
  authorize(ROLES.INSTITUTION, ROLES.ADMIN),
  async (req, res) => {
    try {
      res.set({
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        Pragma: 'no-cache',
        Expires: '0',
      });

      const query = {
        role: ROLES.STUDENT,
        isActive: true,
      };

      if (req.user.role === ROLES.INSTITUTION) {
        if (!req.user.institutionId) {
          return ApiResponse.error(
            res,
            'Institution account is not linked to any institution record.',
            400
          );
        }

        query.institutionId = req.user.institutionId;
      }

      const students = await User.find(query)
        .select(
          '_id name email studentId institutionId institutionCode institutionName createdAt'
        )
        .sort({ name: 1 })
        .lean();

      return ApiResponse.success(
        res,
        students,
        'Students retrieved successfully.'
      );
    } catch (error) {
      console.error('Get Students Error:', error);
      return ApiResponse.error(res, 'Failed to retrieve students.', 500);
    }
  }
);

// ============================================================
// GET /api/students/:id
// ============================================================
// Institution:
//   Can only view a student belonging to its own institution.
//
// Admin:
//   Can view any student.
// ============================================================

router.get(
  '/:id',
  authenticate,
  authorize(ROLES.INSTITUTION, ROLES.ADMIN),
  async (req, res) => {
    try {
      const studentId = req.params.id;

      if (!mongoose.Types.ObjectId.isValid(studentId)) {
        return ApiResponse.error(res, 'Invalid student identifier format.', 400);
      }

      const student = await User.findOne({
        _id: studentId,
        role: ROLES.STUDENT,
      })
        .select(
          '_id name email studentId institutionId institutionCode institutionName isActive createdAt'
        )
        .lean();

      if (!student) {
        return ApiResponse.error(res, 'Student record not found.', 404);
      }

      // Tenant isolation for institution users
      if (req.user.role === ROLES.INSTITUTION) {
        if (
          !student.institutionId ||
          student.institutionId.toString() !== req.user.institutionId.toString()
        ) {
          return ApiResponse.error(
            res,
            'Access denied. Student does not belong to your institution.',
            403
          );
        }
      }

      return ApiResponse.success(res, student, 'Student details retrieved successfully.');
    } catch (error) {
      console.error('Get Single Student Error:', error);
      return ApiResponse.error(res, 'Failed to retrieve student details.', 500);
    }
  }
);

module.exports = router;