const assert = require('node:assert/strict');
const test = require('node:test');

const { getCheckInCacheKey } = require('../utils/checkInCache');

test('separates cache keys by route include shape', () => {
  assert.notEqual(
    getCheckInCacheKey({ eventId: 'event-1', date: '2026-06-02', include: 'person,household' }),
    getCheckInCacheKey({ eventId: 'event-1', date: '2026-06-02', include: 'person,locations,checked_in_at' })
  );
});

test('separates cache keys by event date', () => {
  assert.notEqual(
    getCheckInCacheKey({ eventId: 'event-1', date: '2026-06-02', include: 'person,locations,checked_in_at' }),
    getCheckInCacheKey({ eventId: 'event-1', date: '2026-06-03', include: 'person,locations,checked_in_at' })
  );
});
