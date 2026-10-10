const { verifyToken } = require('../utils/jwt');
const userStore = require('../models/userStore');

// Authenticates the request: valid JWT AND the user still exists. The role
// is read from the user store (not trusted from the token), so a changed or
// removed account takes effect immediately rather than when the token expires.
function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ status: 'error', message: 'Authentication required' });
  }

  try {
    const decoded = verifyToken(header.split(' ')[1]);
    const user = userStore.findById(decoded.sub);
    if (!user) throw new Error('user no longer exists');
    req.user = { id: user.id, name: user.name, email: user.email, role: user.role };
    return next();
  } catch (err) {
    // Same message for every failure reason - nothing useful for an attacker
    return res.status(401).json({ status: 'error', message: 'Invalid or expired token' });
  }
}

// RBAC guard: only the listed roles may continue.
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res
        .status(403)
        .json({ status: 'error', message: 'You do not have permission to perform this action' });
    }
    return next();
  };
}

module.exports = { requireAuth, requireRole };
