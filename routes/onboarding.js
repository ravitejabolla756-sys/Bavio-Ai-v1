const express = require('express');
const router = express.Router();
const onboardingController = require('../controllers/onboardingController');
const { authenticateJwt } = require('../middleware/auth');

// Protected routes - require JWT
router.post('/save-step', authenticateJwt, onboardingController.saveStep);
router.get('/status/:client_id', authenticateJwt, onboardingController.getStatus);

module.exports = router;
