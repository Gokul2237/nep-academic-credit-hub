const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { getInstitutionOverview } = require('../controllers/institutionController');

/**
 * GET /overview
 * Retrieve comprehensive statistics and live metrics for an institution
 * Access: Institution, Admin
 */
router.get('/overview', authenticate, authorize('institution', 'admin'), getInstitutionOverview);

module.exports = router;
