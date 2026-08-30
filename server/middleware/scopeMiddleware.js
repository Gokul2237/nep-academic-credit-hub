const ApiResponse = require('../utils/apiResponse');

/**
 * Institution Scoping Middleware
 * Prevents IDOR by verifying that an institution user only accesses their own institution's resources.
 * Superadmins bypass this check.
 */
const requireInstitutionScope = (paramName = 'institutionId') => {
  return (req, res, next) => {
    if (!req.user) {
      return ApiResponse.error(res, 'Authentication required.', 401);
    }

    // Superadmin has global scope access
    if (req.user.role === 'admin') {
      return next();
    }

    if (req.user.role !== 'institution') {
      return ApiResponse.error(res, 'Only institution representatives can perform this operation.', 403);
    }

    // Retrieve target institution ID from params, body, or query
    const targetInstitutionId =
      req.params[paramName] || req.body[paramName] || req.query[paramName];

    if (!targetInstitutionId) {
      return next(); // If not explicitly targeting an ID, controller uses req.user.institutionId
    }

    const userInstitutionId = req.user.institutionId ? req.user.institutionId.toString() : null;

    if (userInstitutionId && userInstitutionId !== targetInstitutionId.toString()) {
      return ApiResponse.error(
        res,
        'Access denied: You are not authorized to access or modify data for another institution.',
        403
      );
    }

    next();
  };
};

module.exports = {
  requireInstitutionScope,
};
