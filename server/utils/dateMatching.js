const DEFAULT_EVENT_TIME_ZONE = process.env.EVENT_TIME_ZONE || 'America/Chicago';
const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function formatDateInTimeZone(value, timeZone = DEFAULT_EVENT_TIME_ZONE) {
  if (!value) {
    return null;
  }

  if (DATE_ONLY_PATTERN.test(value)) {
    return value;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(date);

  const byType = Object.fromEntries(parts.map(part => [part.type, part.value]));
  return `${byType.year}-${byType.month}-${byType.day}`;
}

function isMatchingEventDate(createdAt, eventDate, timeZone = DEFAULT_EVENT_TIME_ZONE) {
  if (!eventDate || !DATE_ONLY_PATTERN.test(eventDate)) {
    return false;
  }

  return formatDateInTimeZone(createdAt, timeZone) === eventDate;
}

module.exports = {
  DEFAULT_EVENT_TIME_ZONE,
  formatDateInTimeZone,
  isMatchingEventDate
};
