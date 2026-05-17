const DEFAULT_EVENT_TIME_ZONE = 'America/Chicago';
const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const formatters = new Map();

function getFormatter(timeZone) {
  if (!formatters.has(timeZone)) {
    formatters.set(
      timeZone,
      new Intl.DateTimeFormat('en-US', {
        timeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      })
    );
  }

  return formatters.get(timeZone);
}

function formatDateInTimeZone(value, timeZone = DEFAULT_EVENT_TIME_ZONE) {
  if (!value) {
    return null;
  }

  if (typeof value === 'string' && DATE_ONLY_PATTERN.test(value)) {
    return value;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const parts = getFormatter(timeZone).formatToParts(date);
  const year = parts.find(part => part.type === 'year')?.value;
  const month = parts.find(part => part.type === 'month')?.value;
  const day = parts.find(part => part.type === 'day')?.value;

  if (!year || !month || !day) {
    return null;
  }

  return `${year}-${month}-${day}`;
}

function isSameEventDate(checkInCreatedAt, eventDate, timeZone = DEFAULT_EVENT_TIME_ZONE) {
  if (!DATE_ONLY_PATTERN.test(eventDate || '')) {
    return false;
  }

  return formatDateInTimeZone(checkInCreatedAt, timeZone) === eventDate;
}

module.exports = {
  DEFAULT_EVENT_TIME_ZONE,
  formatDateInTimeZone,
  isSameEventDate
};
