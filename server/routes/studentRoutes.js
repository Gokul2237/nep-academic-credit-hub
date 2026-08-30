const express = require('express');
const router = express.Router();

const { User, ROLES } = require('../models/User');
const { authenticate } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

// ============================================================
// GET /api/students
// ============================================================
// Institution:
//   Returns students belonging to the logged-in institution.
//
// Admin:
//   Returns all active students.
//
// Students:
//   Not allowed to access this endpoint.
// ============================================================

router.get(
  '/',
  authenticate,
  authorize(ROLES.INSTITUTION, ROLES.ADMIN),
  async (req, res) => {
    try {
      // --------------------------------------------------------
      // Disable browser/proxy caching for this API response
      // --------------------------------------------------------

      res.set({
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        Pragma: 'no-cache',
        Expires: '0',
      });

      // --------------------------------------------------------
      // Base query
      // --------------------------------------------------------

      const query = {
        role: ROLES.STUDENT,
        isActive: true,
      };

      // --------------------------------------------------------
      // Institution users can only see their own students
      // --------------------------------------------------------

      if (req.user.role === ROLES.INSTITUTION) {
        if (!req.user.institutionId) {
          return res.status(400).json({
            success: false,
            message: 'Institution account is not linked to an institution.',
            errors: null,
            timestamp: new Date().toISOString(),
          });
        }

        query.institutionId = req.user.institutionId;
      }

      // --------------------------------------------------------
      // Get students
      // --------------------------------------------------------

      const students = await User.find(query)
        .select(
          '_id name email studentId institutionId institutionCode institutionName'
        )
        .sort({ name: 1 })
        .lean();

      // --------------------------------------------------------
      // Response
      // --------------------------------------------------------

      return res.status(200).json({
        success: true,
        data: students,
        errors: null,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Get Students Error:', error);

      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve students.',
        errors:
          process.env.NODE_ENV !== 'production'
            ? error.message
            : null,
        timestamp: new Date().toISOString(),
      });
    }
  }
);

module.exports = router;