const express = require('express');

const router = express.Router();

const {
  createCertificate,
  getCertificates,
  getCertificateById,
  verifyCertificate,
  reviewCertificate,
  revokeCertificate,
} = require('../controllers/certificateController');

const { authenticate } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { verificationLimiter } = require('../middleware/rateLimitMiddleware');

/*
 * Public verification with rate limiting
 *
 * IMPORTANT:
 * This route must appear before /:id.
 * Otherwise "verify" could be interpreted as an ID.
 */
router.get(
  '/verify/:certificateId',
  verificationLimiter,
  verifyCertificate
);

// All remaining certificate routes require authentication
router.use(authenticate);

// Certificate listing
router.get(
  '/',
  getCertificates
);

// Certificate details
router.get(
  '/:id',
  getCertificateById
);

// Issue certificate
router.post(
  '/',
  authorize('institution', 'admin'),
  createCertificate
);

// Verify / reject certificate
router.put(
  '/:id/verify',
  authorize('institution', 'admin'),
  reviewCertificate
);

// Revoke certificate
router.put(
  '/:id/revoke',
  authorize('institution', 'admin'),
  revokeCertificate
);

module.exports = router;