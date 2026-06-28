const express = require('express');
const router = express.Router();
const onboardingController = require('../controllers/onboardingController');
const { requireAuth } = require('../middleware/auth');

// Public route - allows landing/signup page lookup
router.get('/detect-country', onboardingController.detectCountry);

// Protected routes - require JWT
router.post('/save-step', requireAuth, onboardingController.saveStep);
router.post('/set-country', requireAuth, onboardingController.setCountry);
router.post('/assign-phone', requireAuth, onboardingController.assignPhone);
router.post('/preview-tts', requireAuth, onboardingController.previewTts);
router.post('/save-ai-setup', requireAuth, onboardingController.saveAiSetup);
router.post('/complete-trial', requireAuth, onboardingController.completeTrial);
router.get('/status/:client_id', requireAuth, onboardingController.getStatus);
router.get('/first-lead', requireAuth, onboardingController.getFirstLead);

module.exports = router;

