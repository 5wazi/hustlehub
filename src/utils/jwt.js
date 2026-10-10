const jwt = require('jsonwebtoken');
const env = require('../config/env');

// Payload kept minimal; the algorithm is pinned on both sign and verify so a
// token cannot be accepted under a different (e.g. "none") algorithm.
function signToken(user) {
  return jwt.sign({ sub: user.id, email: user.email, role: user.role }, env.jwtSecret, {
    algorithm: 'HS256',
    expiresIn: env.jwtExpiresIn,
  });
}

function verifyToken(token) {
  return jwt.verify(token, env.jwtSecret, { algorithms: ['HS256'] });
}

module.exports = { signToken, verifyToken };
