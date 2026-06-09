function getNextUtcDate(date) {
  const start = new Date(`${date}T00:00:00Z`);
  if (Number.isNaN(start.getTime())) {
    return null;
  }

  start.setUTCDate(start.getUTCDate() + 1);
  return start;
}

function buildActiveCheckInsUrl(apiBase, eventId, locationId, date) {
  const params = new URLSearchParams({
    'where[event_id]': eventId,
    include: 'locations',
    'where[created_at][gte]': new Date(`${date}T00:00:00Z`).toISOString(),
    'where[created_at][lt]': getNextUtcDate(date).toISOString()
  });

  return `${apiBase}/check_ins?${params.toString()}`;
}

module.exports = {
  buildActiveCheckInsUrl
};
