const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const DEFAULT_EVENT_TIME_ZONE = process.env.EVENT_TIME_ZONE || 'America/Chicago';

function formatDateInTimeZone(date, timeZone) {
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

function safeFormatDateInTimeZone(date, timeZone) {
  try {
    return formatDateInTimeZone(date, timeZone);
  } catch (error) {
    return formatDateInTimeZone(date, DEFAULT_EVENT_TIME_ZONE);
  }
}

function getCheckInEventDate(createdAt, timeZone = DEFAULT_EVENT_TIME_ZONE) {
  if (!createdAt) {
    return null;
  }

  if (ISO_DATE_PATTERN.test(createdAt)) {
    return createdAt;
  }

  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return safeFormatDateInTimeZone(date, timeZone);
}

function doesCheckInMatchEventDate(createdAt, eventDate, timeZone = DEFAULT_EVENT_TIME_ZONE) {
  if (!ISO_DATE_PATTERN.test(eventDate || '')) {
    return false;
  }

  return getCheckInEventDate(createdAt, timeZone) === eventDate;
}

module.exports = {
  doesCheckInMatchEventDate,
  getCheckInEventDate
};
