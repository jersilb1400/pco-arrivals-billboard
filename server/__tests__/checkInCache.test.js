const assert = require('node:assert/strict');
const { describe, it } = require('node:test');

const {
  buildCheckInCacheKey,
  getCachedCheckInData,
  updateCheckInCache
} = require('../utils/checkInCache');

describe('check-in cache keys', () => {
  it('separates location-status cache entries by event date', () => {
    assert.notEqual(
      buildCheckInCacheKey('location-status', 'event-1', '2026-05-25'),
      buildCheckInCacheKey('location-status', 'event-1', '2026-05-26')
    );
  });

  it('separates cache entries for different API shapes', () => {
    assert.notEqual(
      buildCheckInCacheKey('security-codes', 'event-1'),
      buildCheckInCacheKey('location-status', 'event-1')
    );
  });
});

describe('check-in cache storage', () => {
  it('does not return a cached response for a different key', () => {
    let cache = {
      key: null,
      data: null,
      lastUpdated: null,
      cacheTimeout: 30000
    };

    cache = updateCheckInCache(cache, 'location-status:event-1:2026-05-25', { data: ['today'] }, 1000);

    assert.equal(getCachedCheckInData(cache, 'location-status:event-1:2026-05-26', 2000), null);
  });

  it('returns cached data for the same key before the timeout', () => {
    let cache = {
      key: null,
      data: null,
      lastUpdated: null,
      cacheTimeout: 30000
    };

    cache = updateCheckInCache(cache, 'location-status:event-1:2026-05-25', { data: ['today'] }, 1000);

    assert.deepEqual(
      getCachedCheckInData(cache, 'location-status:event-1:2026-05-25', 2000),
      { data: ['today'] }
    );
  });
});
