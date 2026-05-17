const DEFAULT_EVENT_TIME_ZONE = 'America/Chicago';
const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const formatters = new Map();

function normalizeTimeZone(timeZone) {
  const candidate = timeZone || DEFAULT_EVENT_TIME_ZONE;

  try {
    new Intl.DateTimeFormat('en-US', { timeZone: candidate }).format(new Date(0));
    return candidate;
  } catch (error) {
    return DEFAULT_EVENT_TIME_ZONE;
  }
}

function getFormatter(timeZone) {
  const normalizedTimeZone = normalizeTimeZone(timeZone);

  if (!formatters.has(normalizedTimeZone)) {
    formatters.set(
      normalizedTimeZone,
      new Intl.DateTimeFormat('en-US', {
        timeZone: normalizedTimeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      })
    );
  }

  return formatters.get(normalizedTimeZone);
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
  isSameEventDate,
  normalizeTimeZone
};
