const DEFAULT_EVENT_TIME_ZONE = process.env.EVENT_TIME_ZONE || 'America/Chicago';

function isCheckInOnEventDate(createdAt, eventDate, timeZone = DEFAULT_EVENT_TIME_ZONE) {
  if (!createdAt || !isValidEventDate(eventDate)) {
    return false;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(createdAt)) {
    return createdAt === eventDate;
  }

  const checkInDate = new Date(createdAt);
  if (Number.isNaN(checkInDate.getTime())) {
    return false;
  }

  return formatDateInTimeZone(checkInDate, timeZone) === eventDate;
}

function formatDateInTimeZone(date, timeZone) {
  try {
    return formatDateParts(date, timeZone);
  } catch (error) {
    if (error instanceof RangeError) {
      return formatDateParts(date, 'UTC');
    }
    throw error;
  }
}

function formatDateParts(date, timeZone) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(date);

  const year = parts.find(part => part.type === 'year')?.value;
  const month = parts.find(part => part.type === 'month')?.value;
  const day = parts.find(part => part.type === 'day')?.value;

  return `${year}-${month}-${day}`;
}

function isValidEventDate(eventDate) {
  return /^\d{4}-\d{2}-\d{2}$/.test(eventDate || '');
}

module.exports = {
  DEFAULT_EVENT_TIME_ZONE,
  isCheckInOnEventDate
};
