const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { authenticateApiKey } = require('../middleware/auth');

router.get('/:client_id', authenticateApiKey, analyticsController.getUsage);

module.exports = router;
