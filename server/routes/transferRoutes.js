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

// General Query (Students may view their own history; institutions & admins query their scope)
router.get('/', getTransfers);

// Transfer Initiation: Strictly restricted to authorized institutions and admins
router.post('/', authorize('institution', 'admin'), createTransfer);

// Single Record Details
router.get('/:id', getTransferById);

// Evaluation & Actions: Strictly restricted to authorized institutions and admins
router.put('/:id/review', authorize('institution', 'admin'), reviewTransfer);
router.put('/:id/cancel', authorize('institution', 'admin'), cancelTransfer);

module.exports = router;
