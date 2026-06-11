const DEFAULT_EVENT_TIME_ZONE = 'America/Chicago';

function formatDateInTimeZone(date, timeZone) {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  const parts = formatter.formatToParts(date);
  const year = parts.find(part => part.type === 'year')?.value;
  const month = parts.find(part => part.type === 'month')?.value;
  const day = parts.find(part => part.type === 'day')?.value;

  if (!year || !month || !day) {
    return null;
  }

  return `${year}-${month}-${day}`;
}

function getEventLocalDate(value, timeZone = DEFAULT_EVENT_TIME_ZONE) {
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

function isSameEventDate(value, eventDate, timeZone = DEFAULT_EVENT_TIME_ZONE) {
  if (!eventDate || !/^\d{4}-\d{2}-\d{2}$/.test(eventDate)) {
    return false;
  }

  return getEventLocalDate(value, timeZone) === eventDate;
}

module.exports = {
  DEFAULT_EVENT_TIME_ZONE,
  getEventLocalDate,
  isSameEventDate
};
