const assert = require('assert');
const { isPublicApiRequest } = require('./authConfig');

function publicRequest(method, path) {
  assert.strictEqual(
    isPublicApiRequest(method, path),
    true,
    `${method} ${path} should be public`
  );
}

function protectedRequest(method, path) {
  assert.strictEqual(
    isPublicApiRequest(method, path),
    false,
    `${method} ${path} should require authentication`
  );
}

publicRequest('GET', '/auth-status');
publicRequest('POST', '/auth/login');
publicRequest('GET', '/global-billboard');
publicRequest('GET', '/active-notifications');
publicRequest('POST', '/security-code-entry');
publicRequest('GET', '/location-status');

protectedRequest('POST', '/global-billboard');
protectedRequest('DELETE', '/global-billboard');
protectedRequest('GET', '/events');
protectedRequest('POST', '/cleanup-checked-out');

console.log('authConfig tests passed');
