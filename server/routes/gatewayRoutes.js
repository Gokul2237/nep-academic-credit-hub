const express = require('express');
const router = express.Router();
const {
  getGatewayInfo,
  generateApiKey,
  getApiKeys,
  revokeApiKey,
  getApiLogs,
  getAuditLogs,
  gatewayReadCredits,
  gatewaySubmitCredit,
  gatewayVerifyCertificate,
  gatewayReadStudents,
} = require('../controllers/gatewayController');
const { authenticate } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { authenticateApiKey } = require('../middleware/gatewayMiddleware');

// ============================================================
// GATEWAY MANAGEMENT & TELEMETRY ROUTES (JWT Authenticated)
// ============================================================

router.get('/info', authenticate, authorize('institution', 'admin'), getGatewayInfo);
router.get('/', authenticate, authorize('institution', 'admin'), getGatewayInfo);

router.post('/keys', authenticate, authorize('institution', 'admin'), generateApiKey);
router.get('/keys', authenticate, authorize('institution', 'admin'), getApiKeys);
router.put('/keys/:id/revoke', authenticate, authorize('institution', 'admin'), revokeApiKey);

router.get('/logs', authenticate, authorize('institution', 'admin'), getApiLogs);
router.get('/telemetry', authenticate, authorize('institution', 'admin'), getApiLogs);
router.get('/audit-logs', authenticate, authorize('institution', 'admin'), getAuditLogs);


// ============================================================
// B2B API GATEWAY CONSUMPTION ROUTES (API Key Authenticated)
// ============================================================

router.get('/credits', authenticateApiKey('read:credits'), gatewayReadCredits);
router.get('/v1/credits', authenticateApiKey('read:credits'), gatewayReadCredits);

router.post('/credits', authenticateApiKey('submit:credits'), gatewaySubmitCredit);
router.post('/v1/credits', authenticateApiKey('submit:credits'), gatewaySubmitCredit);

router.post('/certificates/verify', authenticateApiKey('verify:certificates'), gatewayVerifyCertificate);
router.post('/v1/certificates/verify', authenticateApiKey('verify:certificates'), gatewayVerifyCertificate);

router.get('/students', authenticateApiKey('read:students'), gatewayReadStudents);
router.get('/v1/students', authenticateApiKey('read:students'), gatewayReadStudents);

module.exports = router;
