const express = require('express');
const router = express.Router();
const onboardingController = require('../controllers/onboardingController');
const { requireAuth } = require('../middleware/auth');

// Public route
router.get('/detect-country', onboardingController.detectCountry);

// Step-by-step paid onboarding routes (Protected by JWT auth & active subscription check)
router.post('/business', requireAuth, onboardingController.saveBusinessStep);
router.post('/knowledge', requireAuth, onboardingController.saveKnowledgeStep);
router.post('/agent', requireAuth, onboardingController.saveAgentStep);
router.post('/phone', requireAuth, onboardingController.assignPhone);
router.post('/preview-tts', requireAuth, onboardingController.previewTts);
router.post('/test-call', requireAuth, onboardingController.testCallStep);
router.post('/complete', requireAuth, onboardingController.completeOnboardingStep);

// Legacy compatibility routes
router.post('/save-step', requireAuth, onboardingController.saveStep);
router.post('/set-country', requireAuth, onboardingController.setCountry);
router.post('/assign-phone', requireAuth, onboardingController.assignPhone);
router.get('/status/:client_id', requireAuth, onboardingController.getStatus);

module.exports = router;
