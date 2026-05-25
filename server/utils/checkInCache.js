function buildCheckInCacheKey(scope, eventId, date) {
  return [scope, eventId, date || 'all'].map(value => String(value)).join(':');
}

function getCachedCheckInData(cache, key, now = Date.now()) {
  if (cache.key === key &&
      cache.data &&
      cache.lastUpdated &&
      (now - cache.lastUpdated.getTime()) < cache.cacheTimeout) {
    return cache.data;
  }

  return null;
}

function updateCheckInCache(cache, key, data, now = Date.now()) {
  return {
    data,
    key,
    lastUpdated: new Date(now),
    cacheTimeout: cache.cacheTimeout
  };
}

module.exports = {
  buildCheckInCacheKey,
  getCachedCheckInData,
  updateCheckInCache
};
