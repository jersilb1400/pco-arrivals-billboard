function checkInCacheKey({ eventId, scope = 'default', date = 'all', include = 'default' }) {
  if (!eventId) {
    throw new Error('eventId is required for check-in cache keys');
  }

  return [
    normalizePart(scope),
    normalizePart(eventId),
    normalizePart(date),
    normalizePart(include)
  ].join(':');
}

function createCheckInCache(cacheTimeout = 30_000, now = Date.now) {
  let entry = null;

  return {
    get(keyParts) {
      const key = normalizeKey(keyParts);
      if (
        entry &&
        entry.key === key &&
        entry.data &&
        entry.lastUpdated &&
        now() - entry.lastUpdated.getTime() < entry.cacheTimeout
      ) {
        return entry.data;
      }
      return null;
    },

    set(keyParts, data) {
      entry = {
        key: normalizeKey(keyParts),
        data,
        lastUpdated: new Date(now()),
        cacheTimeout
      };
    }
  };
}

function normalizeKey(keyParts) {
  return typeof keyParts === 'string' ? keyParts : checkInCacheKey(keyParts);
}

function normalizePart(value) {
  if (value === undefined || value === null || value === '') {
    return 'all';
  }
  return String(value);
}

module.exports = {
  checkInCacheKey,
  createCheckInCache
};
