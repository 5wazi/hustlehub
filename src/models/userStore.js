// User persistence. Controllers never touch the file directly; swapping in a
// MongoDB/Mongoose model later only changes this module.
const { createCollection } = require('./jsonStore');

const users = createCollection('users.json');

const readUsers = () => users.all();
const findAll = readUsers;
const findById = (id) => users.findById(id);
const findByEmail = (email) =>
  users.all().find((u) => u.email.toLowerCase() === String(email).toLowerCase());

// Only the password HASH is ever stored. Hashing happens in the controller.
function createUser({ name, email, passwordHash, role }) {
  return users.insert({
    name,
    email: email.toLowerCase(),
    passwordHash,
    role: role || 'client',
  });
}

// Strips sensitive fields before a user object ever leaves the backend.
function toPublicUser(user) {
  if (!user) return null;
  const { passwordHash, ...publicUser } = user;
  return publicUser;
}

module.exports = { readUsers, findAll, findById, findByEmail, createUser, toPublicUser };
