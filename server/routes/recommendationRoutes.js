const express = require('express');
const router = express.Router();
const { getCourseRecommendations } = require('../controllers/recommendationController');
const { authenticate } = require('../middleware/authMiddleware');

router.use(authenticate);

router.get('/', getCourseRecommendations);

module.exports = router;
