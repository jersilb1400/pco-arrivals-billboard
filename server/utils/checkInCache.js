function createCheckInCache({ cacheTimeout = 30000 } = {}) {
  const entries = new Map();

  function get(cacheKey) {
    const entry = entries.get(cacheKey);
    if (!entry) {
      return null;
    }

    if ((Date.now() - entry.lastUpdated.getTime()) >= cacheTimeout) {
      entries.delete(cacheKey);
      return null;
    }

    return entry.data;
  }

  function set(cacheKey, data) {
    entries.set(cacheKey, {
      data,
      lastUpdated: new Date()
    });
  }

  return { get, set };
}

function getSecurityCodesCacheKey(eventId) {
  return `security-codes-${eventId}`;
}

function getLocationStatusCacheKey(eventId, date) {
  return `location-status-${eventId}-${date || 'all'}`;
}

module.exports = {
  createCheckInCache,
  getLocationStatusCacheKey,
  getSecurityCodesCacheKey
};
