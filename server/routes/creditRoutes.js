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
const { getStudentOwnSemesterResults } = require('../controllers/resultImportController');
const { authenticate } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

const { validateCreditPayload } = require('../controllers/validationController');

// All credit routes require authenticated user
router.use(authenticate);

// Validation tool
router.post('/validate', authorize('institution', 'admin'), validateCreditPayload);

// Student Specific Summaries
router.get('/wallet-summary', getWalletSummary);
router.get('/timeline', getTimeline);
router.get('/semester-results', getStudentOwnSemesterResults);
router.get('/student/:studentId', getStudentCredits);

// General Query & Single Record
router.get('/', getCredits);
router.get('/:id', getCreditById);

// Institution / Admin Management
router.post('/', authorize('institution', 'admin'), createCredit);
router.put('/:id', authorize('institution', 'admin'), updateCredit);

module.exports = router;
