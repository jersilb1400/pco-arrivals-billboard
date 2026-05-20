const DEFAULT_EVENT_TIME_ZONE = process.env.EVENT_TIME_ZONE || 'America/Chicago';

function isIsoDate(value) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function formatDateInTimeZone(date, timeZone) {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });

  const parts = Object.fromEntries(
    formatter.formatToParts(date).map(part => [part.type, part.value])
  );

  return `${parts.year}-${parts.month}-${parts.day}`;
}

function getEventDateForTimestamp(timestamp, timeZone = DEFAULT_EVENT_TIME_ZONE) {
  if (!timestamp) {
    return null;
  }

  if (isIsoDate(timestamp)) {
    return timestamp;
  }

  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  try {
    return formatDateInTimeZone(date, timeZone);
  } catch (error) {
    return formatDateInTimeZone(date, 'UTC');
  }
}

function isSameEventDate(timestamp, eventDate, timeZone = DEFAULT_EVENT_TIME_ZONE) {
  if (!isIsoDate(eventDate)) {
    return false;
  }

  return getEventDateForTimestamp(timestamp, timeZone) === eventDate;
}

module.exports = {
  DEFAULT_EVENT_TIME_ZONE,
  getEventDateForTimestamp,
  isSameEventDate
};
