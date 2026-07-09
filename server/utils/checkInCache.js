const DEFAULT_CACHE_TIMEOUT = 30000;

function normalizeCachePart(value) {
  if (value === undefined || value === null || value === '') {
    return 'all';
  }

  return String(value);
}

function buildCheckInCacheKey({ scope, eventId, date, include }) {
  return [
    normalizeCachePart(scope),
    normalizeCachePart(eventId),
    normalizeCachePart(date),
    normalizeCachePart(include),
  ].join(':');
}

function isCheckInCacheHit(cache, cacheKey, now = Date.now()) {
  if (!cache || cache.cacheKey !== cacheKey || !cache.data || !cache.lastUpdated) {
    return false;
  }

  const lastUpdated = cache.lastUpdated instanceof Date
    ? cache.lastUpdated.getTime()
    : new Date(cache.lastUpdated).getTime();

  if (Number.isNaN(lastUpdated)) {
    return false;
  }

  const cacheTimeout = cache.cacheTimeout || DEFAULT_CACHE_TIMEOUT;
  return now - lastUpdated < cacheTimeout;
}

module.exports = {
  DEFAULT_CACHE_TIMEOUT,
  buildCheckInCacheKey,
  isCheckInCacheHit,
};
