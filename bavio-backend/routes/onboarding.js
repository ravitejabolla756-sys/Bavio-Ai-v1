const express = require('express');
const router = express.Router();
const onboardingController = require('../controllers/onboardingController');
const { requireAuth } = require('../middleware/auth');

// Protected routes - require JWT
router.post('/save-step', requireAuth, onboardingController.saveStep);
router.post('/complete-trial', requireAuth, onboardingController.completeTrial);
router.get('/status/:client_id', requireAuth, onboardingController.getStatus);

module.exports = router;
