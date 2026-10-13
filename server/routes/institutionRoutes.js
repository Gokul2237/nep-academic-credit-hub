const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const {
  getInstitutionOverview,
  getInstitutionPolicy,
  updateInstitutionPolicy,
} = require('../controllers/institutionController');

/**
 * GET /overview
 * Retrieve comprehensive statistics and live metrics for an institution
 * Access: Institution, Admin
 */
router.get('/overview', authenticate, authorize('institution', 'admin'), getInstitutionOverview);

/**
 * Policy routes
 * GET /policies - Retrieve active policy and version history
 * PUT /policies - Update and publish new policy version
 * Access: Institution, Admin
 */
router.get('/policies', authenticate, authorize('institution', 'admin'), getInstitutionPolicy);
router.put('/policies', authenticate, authorize('institution', 'admin'), updateInstitutionPolicy);

module.exports = router;
