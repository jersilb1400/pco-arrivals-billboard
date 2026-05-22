const DEFAULT_CACHE_TIMEOUT_MS = 30000;

function createEmptyCheckInCache(cacheTimeout = DEFAULT_CACHE_TIMEOUT_MS) {
  return {
    entries: new Map(),
    cacheTimeout
  };
}

function buildCacheKey(eventId, options = {}) {
  const date = options.date || '';
  const includeKey = options.includeKey || 'default';
  return `${String(eventId)}::${String(date)}::${String(includeKey)}`;
}

function getCachedCheckInData(cache, eventId, options = {}, now = Date.now()) {
  if (!cache?.entries) {
    return null;
  }

  const entry = cache.entries.get(buildCacheKey(eventId, options));
  if (!entry?.data || !entry.lastUpdated) {
    return null;
  }

  const cacheTimeout = entry.cacheTimeout || cache.cacheTimeout || DEFAULT_CACHE_TIMEOUT_MS;
  if ((now - entry.lastUpdated.getTime()) >= cacheTimeout) {
    return null;
  }

  return entry.data;
}

function updateCheckInCache(cache, eventId, data, options = {}, now = Date.now()) {
  const nextCache = cache?.entries ? cache : createEmptyCheckInCache(options.cacheTimeout);
  const cacheTimeout = options.cacheTimeout || nextCache.cacheTimeout || DEFAULT_CACHE_TIMEOUT_MS;

  nextCache.entries.set(buildCacheKey(eventId, options), {
    data,
    lastUpdated: new Date(now),
    cacheTimeout
  });

  return nextCache;
}

module.exports = {
  createEmptyCheckInCache,
  getCachedCheckInData,
  updateCheckInCache
};
