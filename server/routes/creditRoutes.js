const express = require('express');
const router = express.Router();

const {
  createCredit,
  getCredits,
  getCreditById,
  getStudentCredits,
  getWalletSummary,
  getTimeline,
  updateCredit,
} = require('../controllers/creditController');
const { authenticate } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

// All credit routes require authenticated user
router.use(authenticate);

// Student Specific Summaries
router.get('/wallet-summary', getWalletSummary);
router.get('/timeline', getTimeline);
router.get('/student/:studentId', getStudentCredits);

// General Query & Single Record
router.get('/', getCredits);
router.get('/:id', getCreditById);

// Institution / Admin Management
router.post('/', authorize('institution', 'admin'), createCredit);
router.put('/:id', authorize('institution', 'admin'), updateCredit);

module.exports = router;
