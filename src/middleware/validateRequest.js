const { validationResult } = require('express-validator');

// Sits after the validation chains on a route. If any rule failed it
// short-circuits with a controlled 400 containing only field + message.
function validateRequest(req, res, next) {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      status: 'error',
      message: 'Validation failed',
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }

  return next();
}

module.exports = validateRequest;
