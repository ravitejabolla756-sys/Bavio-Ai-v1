const express = require('express');
const router = express.Router();
const assistantController = require('../controllers/assistantController');
const { authenticateJwt } = require('../middleware/auth');

router.post('/', authenticateJwt, assistantController.createAssistant);
router.patch('/:id', authenticateJwt, assistantController.updateAssistant);
router.get('/:client_id', authenticateJwt, assistantController.getAssistants);
router.get('/:client_id/config', authenticateJwt, assistantController.getAssistantConfig);

module.exports = router;
