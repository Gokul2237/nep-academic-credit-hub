
const express = require('express');

const router = express.Router();

const {
  register,
  login,
  getMe,
  getInstitutions,
} = require('../controllers/authController');

const { authenticate } = require('../middleware/authMiddleware');

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

module.exports = router;