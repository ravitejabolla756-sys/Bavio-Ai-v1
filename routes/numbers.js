const express = require('express');
const router = express.Router();
const numberController = require('../controllers/numberController');
const { authenticateApiKey } = require('../middleware/auth');

router.post('/buy', authenticateApiKey, numberController.buyNumber);
router.post('/link', authenticateApiKey, numberController.linkNumber);
router.get('/:client_id', authenticateApiKey, numberController.getNumbers);

module.exports = router;
