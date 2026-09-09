const express = require('express');
const router = express.Router();

const {
  createTransfer,
  getTransfers,
  getTransferById,
  reviewTransfer,
  cancelTransfer,
  getTransferStats,
} = require('../controllers/transferController');
const { authenticate } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

// All transfer routes require authentication
router.use(authenticate);

// Transfer Statistics
router.get('/stats', getTransferStats);

// General Query & Creation
router.get('/', getTransfers);
router.post('/', authorize('student', 'admin'), createTransfer);

// Single Record Details
router.get('/:id', getTransferById);

// Evaluation & Actions
router.put('/:id/review', authorize('institution', 'admin'), reviewTransfer);
router.put('/:id/cancel', authorize('student', 'admin'), cancelTransfer);

module.exports = router;
