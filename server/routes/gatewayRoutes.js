const express = require('express');
const router = express.Router();
const {
  generateApiKey,
  getApiKeys,
  revokeApiKey,
  getApiLogs,
  gatewayReadCredits,
  gatewaySubmitCredit,
  gatewayVerifyCertificate,
  gatewayReadStudents,
} = require('../controllers/gatewayController');
const { authenticate } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { authenticateApiKey } = require('../middleware/gatewayMiddleware');

// ============================================================
// API KEY MANAGEMENT ROUTES (JWT Authenticated)
// ============================================================

router.post('/keys', authenticate, authorize('institution', 'admin'), generateApiKey);
router.get('/keys', authenticate, authorize('institution', 'admin'), getApiKeys);
router.put('/keys/:id/revoke', authenticate, authorize('institution', 'admin'), revokeApiKey);
router.get('/logs', authenticate, authorize('institution', 'admin'), getApiLogs);

// ============================================================
// B2B API GATEWAY CONSUMPTION ROUTES (API Key Authenticated)
// ============================================================

router.get('/v1/credits', authenticateApiKey('read:credits'), gatewayReadCredits);
router.post('/v1/credits', authenticateApiKey('submit:credits'), gatewaySubmitCredit);
router.post('/v1/certificates/verify', authenticateApiKey('verify:certificates'), gatewayVerifyCertificate);
router.get('/v1/students', authenticateApiKey('read:students'), gatewayReadStudents);

module.exports = router;
