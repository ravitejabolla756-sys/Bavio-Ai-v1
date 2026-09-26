const express = require('express');
const router = express.Router();
const assistantController = require('../controllers/assistantController');
const testCallController = require('../controllers/testCallController');
const { requireAuth } = require('../middleware/auth');

router.get('/model-tiers', requireAuth, assistantController.getModelTiersCatalog);
router.get('/model-tiers/catalog', requireAuth, assistantController.getModelTiersCatalog);

// ── Test Call Endpoints ──────────────────────────────────────────
router.post('/:id/test-call', requireAuth, testCallController.initiateTestCall);
router.get('/:id/test-call/:callSid', requireAuth, testCallController.getTestCallStatus);
router.post('/:id/test-call/:callSid/hangup', requireAuth, testCallController.hangupTestCall);

router.post('/', requireAuth, assistantController.createAssistant);
router.patch('/:id', requireAuth, assistantController.updateAssistant);
router.get('/:client_id', requireAuth, assistantController.getAssistants);
router.get('/:client_id/config', requireAuth, assistantController.getAssistantConfig);
router.get('/by-id/:id', requireAuth, assistantController.getAssistantById);
router.put('/by-id/:id', requireAuth, assistantController.updateAssistantById);

router.patch('/:id/voice', requireAuth, assistantController.updateAssistantVoice);

module.exports = router;
