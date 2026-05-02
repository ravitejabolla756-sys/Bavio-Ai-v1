const express = require('express');
const router = express.Router();
const leadsController = require('../controllers/leadsController');
const { authenticateJwt } = require('../middleware/auth');

router.post('/', authenticateJwt, leadsController.createLead);
router.get('/:client_id', authenticateJwt, leadsController.getLeads);
router.patch('/:id', authenticateJwt, leadsController.updateLead);

module.exports = router;
