const express = require('express');
const router = express.Router();
const assistantController = require('../controllers/assistantController');
const { requireAuth } = require('../middleware/auth');

router.post('/', requireAuth, assistantController.createAssistant);
router.patch('/:id', requireAuth, assistantController.updateAssistant);
router.get('/:client_id', requireAuth, assistantController.getAssistants);
router.get('/:client_id/config', requireAuth, assistantController.getAssistantConfig);

module.exports = router;
