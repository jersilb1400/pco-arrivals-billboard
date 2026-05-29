const test = require('node:test');
const assert = require('node:assert/strict');

const { buildCheckInCacheKey, createCheckInCache } = require('../utils/checkInCache');

test('cache keys include event date and endpoint shape', () => {
  const securityCodeKey = buildCheckInCacheKey('event-1', {
    endpoint: 'security-codes',
    include: 'person,household'
  });
  const locationStatusKey = buildCheckInCacheKey('event-1', {
    endpoint: 'location-status',
    date: '2026-02-24',
    include: 'person,locations,checked_in_at'
  });
  const nextDateLocationStatusKey = buildCheckInCacheKey('event-1', {
    endpoint: 'location-status',
    date: '2026-02-25',
    include: 'person,locations,checked_in_at'
  });

  assert.notEqual(securityCodeKey, locationStatusKey);
  assert.notEqual(locationStatusKey, nextDateLocationStatusKey);
});

test('check-in cache does not reuse data across scoped keys', () => {
  const cache = createCheckInCache(30_000);
  const todayKey = buildCheckInCacheKey('event-1', {
    endpoint: 'location-status',
    date: '2026-02-24',
    include: 'person,locations,checked_in_at'
  });
  const tomorrowKey = buildCheckInCacheKey('event-1', {
    endpoint: 'location-status',
    date: '2026-02-25',
    include: 'person,locations,checked_in_at'
  });

  cache.set(todayKey, { data: [{ id: 'today' }], included: [] });

  assert.deepEqual(cache.get(todayKey), { data: [{ id: 'today' }], included: [] });
  assert.equal(cache.get(tomorrowKey), null);
});
