const DEFAULT_EVENT_TIME_ZONE = 'America/Chicago';
const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function formatDateInTimeZone(date, timeZone = DEFAULT_EVENT_TIME_ZONE) {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  const parts = formatter.formatToParts(date);
  const values = Object.fromEntries(parts.map(part => [part.type, part.value]));

  return `${values.year}-${values.month}-${values.day}`;
}

function checkInMatchesEventDate(createdAt, eventDate, timeZone = DEFAULT_EVENT_TIME_ZONE) {
  if (!createdAt || !DATE_ONLY_PATTERN.test(String(eventDate || ''))) {
    return false;
  }

  if (DATE_ONLY_PATTERN.test(String(createdAt))) {
    return String(createdAt) === eventDate;
  }

  const createdAtDate = new Date(createdAt);
  if (Number.isNaN(createdAtDate.getTime())) {
    return false;
  }

  try {
    return formatDateInTimeZone(createdAtDate, timeZone) === eventDate;
  } catch (error) {
    return formatDateInTimeZone(createdAtDate, 'UTC') === eventDate;
  }
}

module.exports = {
  DEFAULT_EVENT_TIME_ZONE,
  checkInMatchesEventDate,
  formatDateInTimeZone
};
