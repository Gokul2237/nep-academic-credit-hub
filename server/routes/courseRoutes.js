const express = require('express');
const router = express.Router();

const {
  createCourse,
  getCourses,
  getCourseById,
  updateCourse,
  deleteCourse,
} = require('../controllers/courseController');
const { authenticate } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

// All course catalog routes require authenticated user
router.use(authenticate);

// Public / Authenticated Course Catalog Search
router.get('/', getCourses);
router.get('/:id', getCourseById);

// Institution & Admin Course Management
router.post('/', authorize('institution', 'admin'), createCourse);
router.put('/:id', authorize('institution', 'admin'), updateCourse);
router.delete('/:id', authorize('institution', 'admin'), deleteCourse);

module.exports = router;
