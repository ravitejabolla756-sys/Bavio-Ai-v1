const express = require('express');
const router = express.Router();
const assistantController = require('../controllers/assistantController');
const { authenticateApiKey } = require('../middleware/auth');

router.post('/', authenticateApiKey, assistantController.createAssistant);
router.get('/:client_id', authenticateApiKey, assistantController.getAssistants);

module.exports = router;
