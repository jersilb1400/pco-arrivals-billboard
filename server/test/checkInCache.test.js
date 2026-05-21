const test = require('node:test');
const assert = require('node:assert/strict');

const {
  createCheckInCache,
  getLocationStatusCacheKey,
  getSecurityCodesCacheKey
} = require('../utils/checkInCache');

test('keeps check-in payloads isolated by endpoint and date cache key', () => {
  const cache = createCheckInCache({ cacheTimeout: 30000 });
  const securityCodePayload = {
    data: [{ id: 'check-in-1' }],
    included: [{ type: 'Household', id: 'household-1' }]
  };
  const locationStatusPayload = {
    data: [{ id: 'check-in-2' }],
    included: [{ type: 'Location', id: 'location-1' }]
  };

  cache.set('security-codes-event-123', securityCodePayload);
  cache.set('location-status-event-123-2026-05-21', locationStatusPayload);

  assert.deepEqual(cache.get('security-codes-event-123'), securityCodePayload);
  assert.deepEqual(cache.get('location-status-event-123-2026-05-21'), locationStatusPayload);
  assert.equal(cache.get('location-status-event-123-2026-05-22'), null);
});

test('builds endpoint-specific check-in cache keys', () => {
  assert.equal(getSecurityCodesCacheKey('event-123'), 'security-codes-event-123');
  assert.equal(
    getLocationStatusCacheKey('event-123', '2026-05-21'),
    'location-status-event-123-2026-05-21'
  );
  assert.equal(getLocationStatusCacheKey('event-123'), 'location-status-event-123-all');
});
