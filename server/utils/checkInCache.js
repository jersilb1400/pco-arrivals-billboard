function createCheckInCache(cacheTimeout = 30000) {
  let cacheEntry = {
    key: null,
    data: null,
    lastUpdated: null
  };

  return {
    get(key) {
      if (
        cacheEntry.key === key &&
        cacheEntry.data &&
        cacheEntry.lastUpdated &&
        Date.now() - cacheEntry.lastUpdated.getTime() < cacheTimeout
      ) {
        return cacheEntry.data;
      }

      return null;
    },

    set(key, data) {
      cacheEntry = {
        key,
        data,
        lastUpdated: new Date()
      };
    },

    clear() {
      cacheEntry = {
        key: null,
        data: null,
        lastUpdated: null
      };
    }
  };
}

module.exports = {
  createCheckInCache
};
