const rateLimit = require('express-rate-limit');

/**
 * Public Verification Rate Limiter
 * Allows normal users to verify transcripts and certificates
 * while preventing automated abuse and scraping.
 */
const verificationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 150, // 150 verification requests per 15-minute window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many verification attempts from this IP. Please try again after 15 minutes.',
  },
});

/**
 * Authentication Rate Limiter
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts from this IP. Please try again after 15 minutes.',
  },
});

module.exports = {
  verificationLimiter,
  authLimiter,
};
