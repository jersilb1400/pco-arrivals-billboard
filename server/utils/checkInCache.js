function buildCacheKey(eventId, options = {}) {
  const scope = options.scope || 'default';
  const date = options.date || 'all';
  return `${scope}:${String(eventId)}:${String(date)}`;
}

function createCheckInCache({ cacheTimeout = 30000 } = {}) {
  let entry = null;

  return {
    get(eventId, options = {}) {
      const now = options.now || Date.now();
      const key = buildCacheKey(eventId, options);

      if (
        entry &&
        entry.key === key &&
        entry.data &&
        now - entry.lastUpdated < cacheTimeout
      ) {
        return entry.data;
      }

      return null;
    },

    set(eventId, data, options = {}) {
      const now = options.now || Date.now();

      entry = {
        key: buildCacheKey(eventId, options),
        data,
        lastUpdated: now
      };
    }
  };
}

module.exports = {
  createCheckInCache,
  buildCacheKey
};
