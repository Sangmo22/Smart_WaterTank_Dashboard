const rateLimit = require('express-rate-limit');
const ErrorResponse = require('../utils/errorResponse');

const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // Limit each IP to 30 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req, res, next) => {
    next(new ErrorResponse('Too many auth attempts from this IP, please try again after 15 minutes', 429, 'RATE_LIMIT_EXCEEDED'));
  }
});

module.exports = { authRateLimiter };
