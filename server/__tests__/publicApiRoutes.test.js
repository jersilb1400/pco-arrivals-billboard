const assert = require('node:assert/strict');
const test = require('node:test');

const { isPublicApiPath } = require('../utils/publicApiRoutes');

test('allows only method-specific public volunteer and display routes', () => {
  assert.equal(isPublicApiPath('GET', '/global-billboard'), true);
  assert.equal(isPublicApiPath('GET', '/active-notifications'), true);
  assert.equal(isPublicApiPath('GET', '/location-status'), true);
  assert.equal(isPublicApiPath('POST', '/security-code-entry'), true);
});

test('keeps admin mutations on shared paths authenticated', () => {
  assert.equal(isPublicApiPath('POST', '/global-billboard'), false);
  assert.equal(isPublicApiPath('DELETE', '/global-billboard'), false);
  assert.equal(isPublicApiPath('PUT', '/location-colors'), false);
});
