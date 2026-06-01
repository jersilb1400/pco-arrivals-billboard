const assert = require('node:assert/strict');
const test = require('node:test');

const { isPublicApiRoute } = require('../utils/publicApiRoutes');

test('allows public volunteer and display endpoints without API credentials', () => {
  assert.equal(isPublicApiRoute('GET', '/auth-status'), true);
  assert.equal(isPublicApiRoute('POST', '/auth/login'), true);
  assert.equal(isPublicApiRoute('GET', '/debug/env'), true);
  assert.equal(isPublicApiRoute('GET', '/global-billboard'), true);
  assert.equal(isPublicApiRoute('GET', '/active-notifications'), true);
  assert.equal(isPublicApiRoute('GET', '/location-status'), true);
  assert.equal(isPublicApiRoute('POST', '/security-code-entry'), true);
});

test('keeps admin and mutation endpoints behind API credentials', () => {
  assert.equal(isPublicApiRoute('POST', '/set-global-billboard'), false);
  assert.equal(isPublicApiRoute('DELETE', '/global-billboard'), false);
  assert.equal(isPublicApiRoute('GET', '/admin/users'), false);
  assert.equal(isPublicApiRoute('PUT', '/location-colors'), false);
  assert.equal(isPublicApiRoute('POST', '/cleanup-checked-out'), false);
});
