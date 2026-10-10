const fs = require('fs');
const https = require('https');
const path = require('path');

const env = require('./src/config/env');
const app = require('./src/app');

const keyPath = path.resolve(env.sslKeyPath);
const certPath = path.resolve(env.sslCertPath);

if (!fs.existsSync(keyPath) || !fs.existsSync(certPath)) {
  console.error(
    'SSL certificate/key not found.\n' +
      `Expected key at:  ${keyPath}\n` +
      `Expected cert at: ${certPath}\n\n` +
      'Generate a local self-signed certificate first - see certs/README.md.'
  );
  process.exit(1);
}

const sslOptions = {
  key: fs.readFileSync(keyPath),
  cert: fs.readFileSync(certPath),
};

https.createServer(sslOptions, app).listen(env.port, () => {
  console.log(`HustleHub listening securely on https://localhost:${env.port}`);
  console.log(`Environment: ${env.nodeEnv}`);
});
