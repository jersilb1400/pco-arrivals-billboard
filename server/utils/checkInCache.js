function normalizeCachePart(value) {
  return value === undefined || value === null ? '' : String(value);
}

function createCacheKey({ eventId, date, scope }) {
  return [
    normalizeCachePart(eventId),
    normalizeCachePart(date),
    normalizeCachePart(scope)
  ].join('|');
}

function createCheckInCache({ ttlMs = 30000, now = () => Date.now() } = {}) {
  let entry = {
    key: null,
    data: null,
    lastUpdated: null
  };

  return {
    get(keyParts) {
      const key = createCacheKey(keyParts);
      if (
        entry.key === key &&
        entry.data &&
        entry.lastUpdated &&
        now() - entry.lastUpdated < ttlMs
      ) {
        return entry.data;
      }

      return null;
    },

    set(keyParts, data) {
      entry = {
        key: createCacheKey(keyParts),
        data,
        lastUpdated: now()
      };
      return data;
    },

    clear() {
      entry = {
        key: null,
        data: null,
        lastUpdated: null
      };
    }
  };
}

module.exports = {
  createCacheKey,
  createCheckInCache
};
