const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { authenticateJwt } = require('../middleware/auth');

router.get('/:client_id', authenticateJwt, analyticsController.getCalls);

module.exports = router;
