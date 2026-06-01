const assert = require('node:assert/strict');
const test = require('node:test');

const { createCheckInCache } = require('../utils/checkInCache');

test('does not reuse check-in data across route/date cache keys', () => {
  let now = 1000;
  const cache = createCheckInCache({
    timeoutMs: 30000,
    now: () => now
  });

  cache.update('security-codes:event-1:all', { data: ['all-dates'] });

  assert.equal(cache.get('location-status:event-1:2026-06-01'), null);
  assert.deepEqual(cache.get('security-codes:event-1:all'), { data: ['all-dates'] });
});

test('expires cached check-in data after the timeout', () => {
  let now = 1000;
  const cache = createCheckInCache({
    timeoutMs: 30000,
    now: () => now
  });

  cache.update('location-status:event-1:2026-06-01', { data: ['today'] });
  now += 30001;

  assert.equal(cache.get('location-status:event-1:2026-06-01'), null);
});
