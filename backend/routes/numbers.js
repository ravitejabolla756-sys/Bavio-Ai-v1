const express = require('express');
const router = express.Router();
const numberController = require('../controllers/numberController');
const { requireAuth } = require('../middleware/auth');

router.post('/buy', requireAuth, numberController.buyNumber);
router.post('/link', requireAuth, numberController.linkNumber);
router.get('/:client_id', requireAuth, numberController.getNumbers);

module.exports = router;
