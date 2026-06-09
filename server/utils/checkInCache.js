function normalizeInclude(include) {
  if (Array.isArray(include)) {
    return include.slice().sort().join(',');
  }

  return String(include || '')
    .split(',')
    .map(part => part.trim())
    .filter(Boolean)
    .sort()
    .join(',');
}

function buildCheckInCacheKey({ route, eventId, date, include }) {
  return [
    route || 'unknown-route',
    eventId || 'unknown-event',
    date || 'all-dates',
    normalizeInclude(include) || 'default-include'
  ].join('|');
}

function getCachedCheckInData(cache, cacheKey, now = Date.now()) {
  if (
    cache &&
    cache.cacheKey === cacheKey &&
    cache.data &&
    cache.lastUpdated &&
    now - cache.lastUpdated.getTime() < cache.cacheTimeout
  ) {
    return cache.data;
  }

  return null;
}

function updateCheckInCache(cache, cacheKey, data, cacheTimeout = 30000, now = Date.now()) {
  return {
    data,
    cacheKey,
    lastUpdated: new Date(now),
    cacheTimeout
  };
}

module.exports = {
  buildCheckInCacheKey,
  getCachedCheckInData,
  updateCheckInCache
};
