const userStore = require('../models/userStore');
const asyncHandler = require('../utils/asyncHandler');

// passwordHash is stripped by toPublicUser - it never leaves the backend
const listUsers = asyncHandler(async (req, res) => {
  res.json({ status: 'success', data: { users: userStore.readUsers().map(userStore.toPublicUser) } });
});

module.exports = { listUsers };
