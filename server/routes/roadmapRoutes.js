const express = require('express');
const router = express.Router();
const {
  getMyRoadmapAndReadiness,
  getStudentRoadmapById,
} = require('../controllers/roadmapController');
const { authenticate } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

// All roadmap endpoints require authentication
router.use(authenticate);

/**
 * GET /api/students/readiness-roadmap/me
 * Student-specific self-analysis
 */
router.get('/me', getMyRoadmapAndReadiness);

/**
 * GET /api/students/readiness-roadmap/:studentId
 * Institution / Admin inspection
 */
router.get('/:studentId', authorize('institution', 'admin'), getStudentRoadmapById);

module.exports = router;
