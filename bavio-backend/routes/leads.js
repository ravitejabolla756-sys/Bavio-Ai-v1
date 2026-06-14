const express = require('express');
const router = express.Router();
const leadsController = require('../controllers/leadsController');
const { requireAuth } = require('../middleware/auth');

router.post('/', requireAuth, leadsController.createLead);
router.get('/:client_id', requireAuth, leadsController.getLeads);
router.patch('/:id', requireAuth, leadsController.updateLead);

module.exports = router;
