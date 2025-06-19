const rateLimit = require('express-rate-limit');

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: 'Too many login attempts, please try again after 15 minutes',
  standardHeaders: true,
  legacyHeaders: false,
});

const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 200, // Increased from 100 to 200 requests per minute
  message: 'Too many requests from this IP, please try again after a minute',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for authenticated users on certain endpoints
    if (req.session?.user) {
      const skipEndpoints = [
        '/api/auth-status',
        '/api/global-billboard',
        '/api/billboard-updates'
      ];
      return skipEndpoints.some(endpoint => req.path.startsWith(endpoint));
    }
    return false;
  }
});

module.exports = { authLimiter, apiLimiter }; 