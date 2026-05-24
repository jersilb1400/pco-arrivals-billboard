const assert = require('assert');
const { loadServerConfig, requireEnv } = require('./env');

assert.throws(
  () => requireEnv('REQUIRED_ENV_TEST_VALUE', {}),
  /REQUIRED_ENV_TEST_VALUE environment variable is required/
);

assert.strictEqual(
  requireEnv('REQUIRED_ENV_TEST_VALUE', { REQUIRED_ENV_TEST_VALUE: 'configured-value' }),
  'configured-value'
);

assert.throws(
  () => loadServerConfig({ TURNSTILE_SECRET_KEY: 'turnstile-secret' }),
  /API_SECRET environment variable is required/
);

assert.throws(
  () => loadServerConfig({ API_SECRET: 'api-secret' }),
  /TURNSTILE_SECRET_KEY environment variable is required/
);

assert.deepStrictEqual(
  loadServerConfig({
    API_SECRET: 'api-secret',
    TURNSTILE_SECRET_KEY: 'turnstile-secret'
  }),
  {
    apiSecret: 'api-secret',
    turnstileSecretKey: 'turnstile-secret'
  }
);
