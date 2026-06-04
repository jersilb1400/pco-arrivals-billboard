const DEFAULT_CACHE_TIMEOUT_MS = 30000;

function normalizeCachePart(value, fallback = 'all') {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }
  return String(value);
}

function getCheckInCacheKey({ route, eventId, date, include }) {
  if (!route) {
    throw new Error('route is required for check-in cache keys');
  }
  if (!eventId) {
    throw new Error('eventId is required for check-in cache keys');
  }

  return [
    normalizeCachePart(route),
    normalizeCachePart(eventId),
    normalizeCachePart(date),
    normalizeCachePart(include, 'default'),
  ].join(':');
}

function isFreshCacheEntry(cacheEntry, cacheKey, now = Date.now()) {
  if (!cacheEntry || cacheEntry.key !== cacheKey || !cacheEntry.data || !cacheEntry.lastUpdated) {
    return false;
  }

  const lastUpdated = new Date(cacheEntry.lastUpdated).getTime();
  if (Number.isNaN(lastUpdated)) {
    return false;
  }

  const cacheTimeout = cacheEntry.cacheTimeout || DEFAULT_CACHE_TIMEOUT_MS;
  return now - lastUpdated < cacheTimeout;
}

function makeCacheEntry(cacheKey, data, now = new Date()) {
  return {
    key: cacheKey,
    data,
    lastUpdated: now,
    cacheTimeout: DEFAULT_CACHE_TIMEOUT_MS,
  };
}

module.exports = {
  DEFAULT_CACHE_TIMEOUT_MS,
  getCheckInCacheKey,
  isFreshCacheEntry,
  makeCacheEntry,
};
