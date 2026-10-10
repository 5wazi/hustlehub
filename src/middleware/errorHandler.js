const env = require('../config/env');

function notFoundHandler(req, res) {
  res.status(404).json({ status: 'error', message: 'Resource not found' });
}

// Final error handler. Clients only ever see short generic messages; the full
// error (stack, paths) is logged server-side. Known body-parser failures are
// mapped explicitly so their raw parser messages never reach the client.
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);

  console.error(`[${new Date().toISOString()}] ${req.method} ${req.path} ->`, err);

  let status = 500;
  let message = 'Something went wrong. Please try again later.';

  if (err.type === 'entity.parse.failed') {
    status = 400;
    message = 'Malformed JSON in request body';
  } else if (err.type === 'entity.too.large') {
    status = 413;
    message = 'Request body is too large';
  }

  const body = { status: 'error', message };
  if (env.nodeEnv === 'development' && status === 500) {
    body.hint = 'See server console for details.';
  }
  res.status(status).json(body);
}

module.exports = { notFoundHandler, errorHandler };
