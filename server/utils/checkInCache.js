const DEFAULT_CACHE_TIMEOUT_MS = 30000;

function createCheckInCache(cacheTimeout = DEFAULT_CACHE_TIMEOUT_MS) {
  return {
    entries: new Map(),
    cacheTimeout
  };
}

function buildCacheKey({ route, eventId, date = '', include = '' }) {
  return [
    route || 'default',
    String(eventId || ''),
    String(date || ''),
    String(include || '')
  ].join('|');
}

function getCachedCheckInData(cache, cacheDescriptor) {
  const key = buildCacheKey(cacheDescriptor);
  const entry = cache.entries.get(key);

  if (!entry) {
    return null;
  }

  if ((Date.now() - entry.lastUpdated.getTime()) >= cache.cacheTimeout) {
    cache.entries.delete(key);
    return null;
  }

  return entry.data;
}

function updateCheckInCache(cache, cacheDescriptor, data) {
  cache.entries.set(buildCacheKey(cacheDescriptor), {
    data,
    lastUpdated: new Date()
  });
}

module.exports = {
  createCheckInCache,
  getCachedCheckInData,
  updateCheckInCache
};
