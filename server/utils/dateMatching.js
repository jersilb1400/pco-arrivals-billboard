const DEFAULT_EVENT_TIME_ZONE = 'America/Chicago';

function dateInTimeZone(value, timeZone = DEFAULT_EVENT_TIME_ZONE) {
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
    return date.toISOString().slice(0, 10);
  }
}

function matchesEventDate(value, eventDate, timeZone = DEFAULT_EVENT_TIME_ZONE) {
  if (!value || !eventDate) {
    return false;
  }

  return dateInTimeZone(value, timeZone) === eventDate;
}

module.exports = {
  DEFAULT_EVENT_TIME_ZONE,
  dateInTimeZone,
  matchesEventDate
};
