const DEFAULT_EVENT_TIME_ZONE = process.env.EVENT_TIME_ZONE || 'America/Chicago';

function isDateOnly(value) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function formatDateInTimeZone(value, timeZone) {
  if (isDateOnly(value)) {
    return value;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).formatToParts(date);

    const getPart = (type) => parts.find((part) => part.type === type)?.value;
    return `${getPart('year')}-${getPart('month')}-${getPart('day')}`;
  } catch (error) {
    return date.toISOString().slice(0, 10);
  }
}

function matchesEventDate(createdAt, eventDate, options = {}) {
  if (!createdAt || !isDateOnly(eventDate)) {
    return false;
  }

  const timeZone = options.timeZone || DEFAULT_EVENT_TIME_ZONE;
  return formatDateInTimeZone(createdAt, timeZone) === eventDate;
}

module.exports = {
  matchesEventDate,
  formatDateInTimeZone
};
