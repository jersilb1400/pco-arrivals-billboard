function createCheckInCache({ timeoutMs = 30000, now = Date.now } = {}) {
  let cache = {
    key: null,
    data: null,
    lastUpdated: null
  };

  return {
    get(key) {
      if (
        cache.key === key &&
        cache.data &&
        cache.lastUpdated !== null &&
        now() - cache.lastUpdated < timeoutMs
      ) {
        return cache.data;
      }

      return null;
    },

    update(key, data) {
      cache = {
        key,
        data,
        lastUpdated: now()
      };
    }
  };
}

function buildCheckInCacheKey(scope, eventId, date = 'all') {
  return `${scope}:${eventId}:${date || 'all'}`;
}

module.exports = {
  buildCheckInCacheKey,
  createCheckInCache
};
