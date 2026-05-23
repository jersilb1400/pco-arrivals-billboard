const assert = require('node:assert/strict');
const test = require('node:test');

const { createCheckInCache } = require('../utils/checkInCache');

test('does not reuse cached check-ins across location-status dates', () => {
  const cache = createCheckInCache({ cacheTimeout: 30000 });
  const may23Data = { data: [{ id: 'may-23' }], included: [] };

  cache.set('event-1', may23Data, {
    scope: 'location-status',
    date: '2026-05-23',
    now: 1000
  });

  assert.equal(
    cache.get('event-1', {
      scope: 'location-status',
      date: '2026-05-24',
      now: 2000
    }),
    null
  );
});

test('does not reuse generic event check-in cache for location-status', () => {
  const cache = createCheckInCache({ cacheTimeout: 30000 });
  const genericData = { data: [{ id: 'all-dates' }], included: [] };

  cache.set('event-1', genericData, { now: 1000 });

  assert.equal(
    cache.get('event-1', {
      scope: 'location-status',
      date: '2026-05-23',
      now: 2000
    }),
    null
  );
});

test('reuses cached location-status check-ins for the same event and date', () => {
  const cache = createCheckInCache({ cacheTimeout: 30000 });
  const may23Data = { data: [{ id: 'may-23' }], included: [] };

  cache.set('event-1', may23Data, {
    scope: 'location-status',
    date: '2026-05-23',
    now: 1000
  });

  assert.equal(
    cache.get('event-1', {
      scope: 'location-status',
      date: '2026-05-23',
      now: 2000
    }),
    may23Data
  );
});
