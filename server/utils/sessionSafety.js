function buildCheckInCacheKey(eventId, options = {}) {
  const scope = options.scope || 'default';
  const date = options.date || 'all-dates';
  const include = options.include || 'default-include';
  return [String(eventId), scope, date, include].join('|');
}

function shouldClearNotifications(currentBillboard, nextEventId, nextEventDate) {
  if (!currentBillboard) {
    return true;
  }

  return String(currentBillboard.eventId) !== String(nextEventId) ||
    String(currentBillboard.eventDate || '') !== String(nextEventDate || '');
}

function formatDateInTimeZone(date, timeZone) {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  const parts = formatter.formatToParts(date);
  const values = {};
  parts.forEach((part) => {
    if (part.type !== 'literal') {
      values[part.type] = part.value;
    }
  });

  return `${values.year}-${values.month}-${values.day}`;
}

function getEventLocalDate(value, timeZone = 'America/Chicago') {
  if (!value) {
    return null;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  try {
    return formatDateInTimeZone(date, timeZone);
  } catch (error) {
    return formatDateInTimeZone(date, 'UTC');
  }
}

function isSameEventDate(value, eventDate, timeZone = 'America/Chicago') {
  if (!eventDate) {
    return false;
  }

  return getEventLocalDate(value, timeZone) === eventDate;
}

function shouldCacheCheckInPage({ isComplete, rateLimited } = {}) {
  return isComplete === true && rateLimited !== true;
}

module.exports = {
  buildCheckInCacheKey,
  getEventLocalDate,
  isSameEventDate,
  shouldCacheCheckInPage,
  shouldClearNotifications
};
