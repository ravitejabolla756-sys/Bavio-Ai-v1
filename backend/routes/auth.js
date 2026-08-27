const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { requireAuth } = require('../middleware/auth');
const { otpRequestLimiter, otpVerifyLimiter } = require('../middleware/otpRateLimit');

router.post('/check-email', authController.checkEmail);
router.post('/signup', otpRequestLimiter, authController.signup);
router.post('/verify-otp', otpVerifyLimiter, authController.verifyOtp);
router.post('/login', authController.login);
router.post('/change-email', authController.changeEmail);
router.post('/resend-verification', otpRequestLimiter, authController.resendVerification);
router.post('/forgot-password', otpRequestLimiter, authController.forgotPassword);
router.post('/verify-reset-token', authController.verifyResetToken);
router.post('/reset-password', otpVerifyLimiter, authController.resetPassword);
router.get('/profile', requireAuth, authController.getProfile);
router.get('/me', requireAuth, authController.getProfile); // Alias
router.patch('/profile', requireAuth, authController.updateProfile);

module.exports = router;
