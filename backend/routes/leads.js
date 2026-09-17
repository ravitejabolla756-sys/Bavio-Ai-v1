const express = require('express');
const router = express.Router();
const leadsController = require('../controllers/leadsController');
const { requireAuth } = require('../middleware/auth');
const { listLeadContext, getLeadContext } = require('../controllers/leadReads');

router.post('/', requireAuth, leadsController.createLead);
router.get('/records/:id', requireAuth, getLeadContext);
router.get('/:client_id', requireAuth, (req, res) => req.query.view === 'context' ? listLeadContext(req, res) : leadsController.getLeads(req, res));
router.patch('/:id', requireAuth, leadsController.updateLead);

module.exports = router;
