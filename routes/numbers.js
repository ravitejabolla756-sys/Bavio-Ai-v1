const express = require('express');
const router = express.Router();
const numberController = require('../controllers/numberController');
const { authenticateJwt } = require('../middleware/auth');

router.post('/buy', authenticateJwt, numberController.buyNumber);
router.post('/link', authenticateJwt, numberController.linkNumber);
router.get('/:client_id', authenticateJwt, numberController.getNumbers);

module.exports = router;
