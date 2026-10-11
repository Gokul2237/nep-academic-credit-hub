const express = require('express');
const router = express.Router();
const { getAdminOverview } = require('../controllers/adminController');
const { authenticate } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(authenticate);
router.use(authorize('admin'));

router.get('/overview', getAdminOverview);

module.exports = router;
