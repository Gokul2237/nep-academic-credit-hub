const ApiResponse = require('../utils/apiResponse');

/**
 * Role-Based Access Control (RBAC) Middleware
 * Restricts route access to specific user roles
 * @param  {...String} allowedRoles - e.g. 'student', 'institution', 'admin'
 */
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return ApiResponse.error(
        res,
        'Authorization failed: user context missing. Ensure authenticate middleware is executed first.',
        500
      );
    }

    if (!allowedRoles.includes(req.user.role)) {
      return ApiResponse.error(
        res,
        `Access denied. Role '${req.user.role}' is not authorized to access this resource. Required role(s): [${allowedRoles.join(', ')}].`,
        403
      );
    }

    next();
  };
};

module.exports = {
  authorize,
};
