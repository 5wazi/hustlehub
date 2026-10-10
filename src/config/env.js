// Single place that reads process.env. Fails fast if a critical value is missing.
require('dotenv').config();

if (!process.env.JWT_SECRET) {
  console.error('Missing required environment variable: JWT_SECRET');
  process.exit(1);
}

const num = (value, fallback) => {
  if (value === undefined || value === '') return fallback;
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

module.exports = {
  port: num(process.env.PORT, 5443),
  nodeEnv: process.env.NODE_ENV || 'development',
  clientOrigins: (process.env.CLIENT_ORIGIN || 'http://localhost:5173')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1h',
  sslKeyPath: process.env.SSL_KEY_PATH || './certs/key.pem',
  sslCertPath: process.env.SSL_CERT_PATH || './certs/cert.pem',
  authRateLimitWindowMs: num(process.env.AUTH_RATE_LIMIT_WINDOW_MS, 15 * 60 * 1000),
  authRateLimitMax: num(process.env.AUTH_RATE_LIMIT_MAX, 20),
  bookingRateLimitWindowMs: num(process.env.BOOKING_RATE_LIMIT_WINDOW_MS, 10 * 60 * 1000),
  bookingRateLimitMax: num(process.env.BOOKING_RATE_LIMIT_MAX, 10),
  apiRateLimitWindowMs: num(process.env.API_RATE_LIMIT_WINDOW_MS, 15 * 60 * 1000),
  apiRateLimitMax: num(process.env.API_RATE_LIMIT_MAX, 300),
  taxRate: num(process.env.TAX_RATE, 0.15),
  currency: process.env.CURRENCY || 'ZAR',
};
