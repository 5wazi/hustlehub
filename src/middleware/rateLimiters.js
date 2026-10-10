const rateLimit = require('express-rate-limit');
const env = require('../config/env');

const build = (windowMs, max, message) =>
  rateLimit({
    windowMs,
    max,
    standardHeaders: true, // RateLimit-* + Retry-After headers
    legacyHeaders: false,
    message: { status: 'error', message },
  });

// Brute-force / credential-stuffing protection on register + login
const authLimiter = build(
  env.authRateLimitWindowMs,
  env.authRateLimitMax,
  'Too many login or registration attempts. Please wait a few minutes and try again.'
);

// Stops booking spam / automated abuse of the transaction-creating endpoint
const bookingLimiter = build(
  env.bookingRateLimitWindowMs,
  env.bookingRateLimitMax,
  'Too many booking attempts. Please wait a few minutes and try again.'
);

// Broad safety net for every other API route
const apiLimiter = build(
  env.apiRateLimitWindowMs,
  env.apiRateLimitMax,
  'Too many requests. Please slow down and try again shortly.'
);

module.exports = { authLimiter, bookingLimiter, apiLimiter };
