
const express = require('express');

const router = express.Router();

const {
  register,
  login,
  getMe,
  getInstitutions,
} = require('../controllers/authController');

const { authenticate } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const ApiResponse = require('../utils/apiResponse');

/*
|--------------------------------------------------------------------------
| PUBLIC AUTH ROUTES
|--------------------------------------------------------------------------
*/

// Register student / institution
router.post('/register', register);

// Login
router.post('/login', login);

// Get verified institutions
// Used by Student Registration dropdown
router.get('/institutions', getInstitutions);

/*
|--------------------------------------------------------------------------
| PROTECTED AUTH ROUTES
|--------------------------------------------------------------------------
*/

// Get currently logged-in user
router.get('/me', authenticate, getMe);

// RBAC Verification Test Routes
router.get('/test/student', authenticate, authorize('student'), (req, res) => {
  return ApiResponse.success(res, { user: req.user.name, role: req.user.role }, 'Student access granted');
});

router.get('/test/institution', authenticate, authorize('institution'), (req, res) => {
  return ApiResponse.success(res, { user: req.user.name, role: req.user.role }, 'Institution access granted');
});

router.get('/test/admin', authenticate, authorize('admin'), (req, res) => {
  return ApiResponse.success(res, { user: req.user.name, role: req.user.role }, 'Admin access granted');
});

module.exports = router;