const express = require('express');
const router = express.Router();

const {
  generateTranscript,
  getTranscripts,
  getTranscriptById,
  verifyTranscript,
  revokeTranscript,
} = require('../controllers/transcriptController');

const { authenticate } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

/*
 * Public verification
 * MUST be registered before /:id route
 */
router.get('/verify/:verificationCode', verifyTranscript);

// Authenticated routes
router.use(authenticate);

// List transcripts
router.get('/', getTranscripts);

// Generate transcript
router.post('/', generateTranscript);

// Get transcript details
router.get('/:id', getTranscriptById);

// Revoke transcript
router.put('/:id/revoke', authorize('institution', 'admin'), revokeTranscript);

module.exports = router;
