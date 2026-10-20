const express = require('express');
const router = express.Router();
const multer = require('multer');
const { authenticate } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const {
  getInstitutionOverview,
  getInstitutionPolicy,
  updateInstitutionPolicy,
} = require('../controllers/institutionController');
const {
  downloadSampleTemplate,
  getTemplateData,
  previewResultsImport,
  confirmResultsImport,
  getImportBatches,
  getBatchDetails,
  getSemesterResults,
  correctResult,
} = require('../controllers/resultImportController');

// Multer memory storage configuration for secure, in-memory spreadsheet parsing
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const isXlsx =
      file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      file.mimetype === 'application/vnd.ms-excel' ||
      file.originalname.match(/\.(xlsx|xls)$/i);

    if (isXlsx) {
      cb(null, true);
    } else {
      cb(new Error('Only Excel spreadsheet files (.xlsx or .xls) are permitted.'));
    }
  },
});

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

/**
 * Results Import & Management Routes
 * Access: Institution, Admin
 */
router.get(
  '/results/template',
  authenticate,
  authorize('institution', 'admin'),
  downloadSampleTemplate
);

router.get(
  '/results/template/data',
  authenticate,
  authorize('institution', 'admin'),
  getTemplateData
);

router.post(
  '/results/preview',
  authenticate,
  authorize('institution', 'admin'),
  upload.single('file'),
  previewResultsImport
);

router.post(
  '/results/confirm',
  authenticate,
  authorize('institution', 'admin'),
  confirmResultsImport
);

router.get(
  '/results/batches',
  authenticate,
  authorize('institution', 'admin'),
  getImportBatches
);

router.get(
  '/results/batches/:batchId',
  authenticate,
  authorize('institution', 'admin'),
  getBatchDetails
);

router.get(
  '/results',
  authenticate,
  authorize('institution', 'admin'),
  getSemesterResults
);

router.put(
  '/results/:id/correct',
  authenticate,
  authorize('institution', 'admin'),
  correctResult
);

module.exports = router;
