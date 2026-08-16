const express = require('express');
const router = express.Router();
const phoneNumberController = require('../controllers/phoneNumberController');
const { requireAuth } = require('../middleware/auth');

// Public catalog endpoints (dynamically cached)
router.get('/countries', phoneNumberController.getCountries);
router.get('/types', phoneNumberController.getNumberTypes);
router.get('/regulatory-requirements', phoneNumberController.getRegulatoryRequirements);
router.get('/search', phoneNumberController.searchNumbers);

// Authenticated management endpoints
router.post('/provision', requireAuth, phoneNumberController.provisionNumber);
router.post('/buy', requireAuth, phoneNumberController.provisionNumber);
router.get('/list', requireAuth, phoneNumberController.listNumbers);
router.get('/:client_id', requireAuth, phoneNumberController.listNumbers);
router.post('/link', requireAuth, phoneNumberController.linkNumber);
router.post('/unlink', requireAuth, phoneNumberController.unlinkNumber);
router.post('/release', requireAuth, phoneNumberController.releaseNumber);
router.delete('/:id', requireAuth, phoneNumberController.releaseNumber);

module.exports = router;
