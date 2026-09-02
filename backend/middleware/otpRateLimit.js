const rateLimit = require('express-rate-limit');

// Rate limit for requesting OTPs (Signup / Resend): Max 5 requests per IP per 15 minutes
const otpRequestLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    success: false,
    error: {
      code: 'rate_limit_exceeded',
      message: 'Too many verification code requests. Please wait 15 minutes before trying again.'
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limit for verifying OTPs: Max 10 attempts per IP per 15 minutes
const otpVerifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    error: {
      code: 'rate_limit_exceeded',
      message: 'Too many verification attempts. Please try again later.'
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  otpRequestLimiter,
  otpVerifyLimiter,
};
