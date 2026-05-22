const DEFAULT_EVENT_TIME_ZONE = 'America/Chicago';

function getDateStringForEventTimeZone(value, timeZone = DEFAULT_EVENT_TIME_ZONE) {
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
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).formatToParts(date);

    const byType = Object.fromEntries(parts.map(part => [part.type, part.value]));
    return `${byType.year}-${byType.month}-${byType.day}`;
  } catch (error) {
    if (timeZone === DEFAULT_EVENT_TIME_ZONE) {
      return null;
    }

    return getDateStringForEventTimeZone(value, DEFAULT_EVENT_TIME_ZONE);
  }
}

function matchesEventDate(checkInCreatedAt, eventDate, timeZone = DEFAULT_EVENT_TIME_ZONE) {
  if (!eventDate) {
    return false;
  }

  return getDateStringForEventTimeZone(checkInCreatedAt, timeZone) === eventDate;
}

module.exports = {
  DEFAULT_EVENT_TIME_ZONE,
  getDateStringForEventTimeZone,
  matchesEventDate
};
