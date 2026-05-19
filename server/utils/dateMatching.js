const DEFAULT_EVENT_TIME_ZONE = process.env.EVENT_TIME_ZONE || 'America/Chicago';

function isDateOnly(value) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function getDatePartsInTimeZone(date, timeZone) {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });

  const parts = formatter.formatToParts(date);
  const year = parts.find(part => part.type === 'year')?.value;
  const month = parts.find(part => part.type === 'month')?.value;
  const day = parts.find(part => part.type === 'day')?.value;

  return `${year}-${month}-${day}`;
}

function getDateInEventTimeZone(value, timeZone = DEFAULT_EVENT_TIME_ZONE) {
  if (!value) {
    return null;
  }

  if (isDateOnly(value)) {
    return value;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  try {
    return getDatePartsInTimeZone(date, timeZone);
  } catch (error) {
    return getDatePartsInTimeZone(date, 'UTC');
  }
}

function isSameEventDate(checkInCreatedAt, eventDate, timeZone = DEFAULT_EVENT_TIME_ZONE) {
  if (!isDateOnly(eventDate)) {
    return false;
  }

  return getDateInEventTimeZone(checkInCreatedAt, timeZone) === eventDate;
}

module.exports = {
  DEFAULT_EVENT_TIME_ZONE,
  getDateInEventTimeZone,
  isSameEventDate
};
