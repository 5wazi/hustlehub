const userStore = require('../models/userStore');
const { hashPassword, comparePassword } = require('../utils/passwords');
const { signToken } = require('../utils/jwt');
const { ROLES } = require('../constants');

// POST /api/auth/register
// The validator only allows 'client' or 'freelancer'; admins are seeded via script.
async function register(req, res, next) {
  try {
    const { name, email, password, role } = req.body;

    if (userStore.findByEmail(email)) {
      // Generic wording: doesn't reveal which field clashed (account enumeration)
      return res.status(409).json({
        status: 'error',
        message: 'An account with these details already exists',
      });
    }

    const passwordHash = await hashPassword(password);
    const newUser = userStore.createUser({ name, email, passwordHash, role: role || ROLES.CLIENT });

    return res.status(201).json({
      status: 'success',
      message: 'Account created successfully',
      data: { user: userStore.toPublicUser(newUser) },
    });
  } catch (err) {
    return next(err);
  }
}

// POST /api/auth/login
async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const user = userStore.findByEmail(email);

    // Identical response for unknown email and wrong password
    const invalidCredentials = () =>
      res.status(401).json({ status: 'error', message: 'Invalid email or password' });

    if (!user) return invalidCredentials();
    if (!(await comparePassword(password, user.passwordHash))) return invalidCredentials();

    return res.status(200).json({
      status: 'success',
      message: 'Login successful',
      data: { token: signToken(user), user: userStore.toPublicUser(user) },
    });
  } catch (err) {
    return next(err);
  }
}

module.exports = { register, login };
