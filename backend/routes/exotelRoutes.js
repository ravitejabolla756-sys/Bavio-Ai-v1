'use strict';

const express = require('express');
const router = express.Router();
const exotelCallController = require('../controllers/exotelCallController');

// Exotel Telephony Webhook Routes
router.post('/incoming', exotelCallController.handleExotelIncoming);
router.get('/incoming', exotelCallController.handleExotelIncoming);

router.post('/gather', exotelCallController.handleExotelGather);
router.get('/gather', exotelCallController.handleExotelGather);

router.post('/status', exotelCallController.handleExotelStatus);
router.get('/status', exotelCallController.handleExotelStatus);

module.exports = router;
