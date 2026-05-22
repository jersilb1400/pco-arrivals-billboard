const test = require('node:test');
const assert = require('node:assert/strict');

const {
  createEmptyCheckInCache,
  getCachedCheckInData,
  updateCheckInCache
} = require('../utils/checkInCache');

test('does not reuse cached check-ins across different dates', () => {
  let cache = createEmptyCheckInCache();
  cache = updateCheckInCache(cache, 'event-1', { data: ['friday'] }, {
    date: '2026-05-22',
    includeKey: 'location-status'
  });

  assert.deepEqual(
    getCachedCheckInData(cache, 'event-1', {
      date: '2026-05-22',
      includeKey: 'location-status'
    }).data,
    ['friday']
  );

  assert.equal(
    getCachedCheckInData(cache, 'event-1', {
      date: '2026-05-23',
      includeKey: 'location-status'
    }),
    null
  );
});

test('does not reuse cached check-ins for endpoints with different include payloads', () => {
  let cache = createEmptyCheckInCache();
  cache = updateCheckInCache(cache, 'event-1', { included: [{ type: 'Person' }] }, {
    includeKey: 'security-codes'
  });

  assert.equal(
    getCachedCheckInData(cache, 'event-1', {
      date: '2026-05-22',
      includeKey: 'location-status'
    }),
    null
  );
});
