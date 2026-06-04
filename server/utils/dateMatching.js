const DEFAULT_EVENT_TIME_ZONE = process.env.EVENT_TIME_ZONE || 'America/Chicago';

function formatDateInTimeZone(value, timeZone = DEFAULT_EVENT_TIME_ZONE) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(date);

    const byType = Object.fromEntries(parts.map((part) => [part.type, part.value]));
    return `${byType.year}-${byType.month}-${byType.day}`;
  } catch (error) {
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}

function matchesEventDate(checkInCreatedAt, eventDate, timeZone = DEFAULT_EVENT_TIME_ZONE) {
  if (!checkInCreatedAt || !eventDate) {
    return false;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(checkInCreatedAt)) {
    return checkInCreatedAt === eventDate;
  }

  return formatDateInTimeZone(checkInCreatedAt, timeZone) === eventDate;
}

module.exports = {
  DEFAULT_EVENT_TIME_ZONE,
  formatDateInTimeZone,
  matchesEventDate,
};
