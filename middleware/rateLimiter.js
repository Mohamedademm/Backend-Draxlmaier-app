const rateLimit = require('express-rate-limit');

/**
 * Rate limiting middleware
 * Prevents abuse by limiting number of requests per IP
 */
const rateLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // Limit each IP to 100 requests per window
  message: {
    status: 'error',
    message: 'Too many requests from this IP, please try again later'
  },
  standardHeaders: true, // Return rate limit info in headers
  legacyHeaders: false, // Disable X-RateLimit headers
  handler: (req, res) => {
    res.status(429).json({
      status: 'error',
      message: 'Too many requests, please try again later'
    });
  }
});

/**
 * Strict rate limiter for sensitive endpoints (e.g., login)
 */
const strictRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit to 5 requests per window
  message: {
    status: 'error',
    message: 'Too many attempts, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      status: 'error',
      message: 'Too many login attempts, please try again after 15 minutes'
    });
  }
});

module.exports = rateLimiter;
module.exports.strictRateLimiter = strictRateLimiter;
