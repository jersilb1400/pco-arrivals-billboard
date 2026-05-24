const assert = require('assert');
const { requireEnv } = require('./env');

const ENV_NAME = 'REQUIRED_ENV_TEST_VALUE';
const originalValue = process.env[ENV_NAME];

try {
  delete process.env[ENV_NAME];
  assert.throws(
    () => requireEnv(ENV_NAME),
    /REQUIRED_ENV_TEST_VALUE environment variable is required/
  );

  process.env[ENV_NAME] = 'configured-value';
  assert.strictEqual(requireEnv(ENV_NAME), 'configured-value');
} finally {
  if (originalValue === undefined) {
    delete process.env[ENV_NAME];
  } else {
    process.env[ENV_NAME] = originalValue;
  }
}
