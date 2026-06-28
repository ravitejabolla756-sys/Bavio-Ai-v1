const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { requireAuth } = require('../middleware/auth');

router.post('/check-email', authController.checkEmail);
router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.get('/profile', requireAuth, authController.getProfile);
router.get('/me', requireAuth, authController.getProfile); // Alias
router.patch('/profile', requireAuth, authController.updateProfile);

module.exports = router;
