function getCheckInCacheKey({ eventId, date = '', include = '' }) {
  return [eventId, date, include].map(value => String(value || '')).join('|');
}

module.exports = {
  getCheckInCacheKey
};
