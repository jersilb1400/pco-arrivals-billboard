function buildCheckInCacheKey(eventId, options = {}) {
  return JSON.stringify({
    eventId: String(eventId),
    endpoint: options.endpoint || null,
    date: options.date || null,
    include: options.include || null
  });
}

function createCheckInCache(cacheTimeout = 30_000) {
  let cache = {
    data: null,
    key: null,
    lastUpdated: null
  };

  return {
    get(key) {
      if (
        cache.key === key &&
        cache.data &&
        cache.lastUpdated &&
        Date.now() - cache.lastUpdated.getTime() < cacheTimeout
      ) {
        return cache.data;
      }
      return null;
    },
    set(key, data) {
      cache = {
        data,
        key,
        lastUpdated: new Date()
      };
    }
  };
}

module.exports = {
  buildCheckInCacheKey,
  createCheckInCache
};
