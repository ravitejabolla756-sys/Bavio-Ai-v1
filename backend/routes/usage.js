const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { requireAuth } = require('../middleware/auth');

router.get('/:client_id', requireAuth, analyticsController.getUsage);

module.exports = router;
