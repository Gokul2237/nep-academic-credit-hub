const express = require('express');
const router = express.Router();
const { getEligibilityStatus } = require('../controllers/eligibilityController');
const { authenticate } = require('../middleware/authMiddleware');

router.use(authenticate);

router.get('/', getEligibilityStatus);

module.exports = router;
