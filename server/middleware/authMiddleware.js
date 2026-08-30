const { verifyToken } = require('../utils/tokenHelper');
const { User } = require('../models/User');
const ApiResponse = require('../utils/apiResponse');

/**
 * Authentication Middleware
 * Validates the JWT Bearer token and attaches authenticated user to req.user
 */
const authenticate = async (req, res, next) => {
  try {
    let token = null;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer ')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return ApiResponse.error(
        res,
        'Authentication required. No bearer token provided.',
        401
      );
    }

    // Verify JWT
    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return ApiResponse.error(res, 'Session expired. Please log in again.', 401);
      }
      return ApiResponse.error(res, 'Invalid authentication token.', 401);
    }

    // Lookup user in DB to ensure account is active and not deleted
    const user = await User.findById(decoded.id).select('-passwordHash');

    if (!user) {
      return ApiResponse.error(res, 'Authenticated user account no longer exists.', 401);
    }

    if (!user.isActive) {
      return ApiResponse.error(res, 'User account has been deactivated.', 403);
    }

    // Attach user to request object
    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication Middleware Error:', error.message);
    return ApiResponse.error(res, 'Authentication failed.', 500);
  }
};

module.exports = {
  authenticate,
};
