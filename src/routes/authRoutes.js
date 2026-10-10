const express = require('express');
const { register, login } = require('../controllers/authController');
const { authLimiter } = require('../middleware/rateLimiters');
const validateRequest = require('../middleware/validateRequest');
const { registerValidationRules, loginValidationRules } = require('../validators/authValidators');

const router = express.Router();

router.post('/register', authLimiter, registerValidationRules, validateRequest, register);
router.post('/login', authLimiter, loginValidationRules, validateRequest, login);

module.exports = router;
