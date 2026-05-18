const DEFAULT_EVENT_TIME_ZONE = process.env.EVENT_TIME_ZONE || 'America/Chicago';

function formatDateInTimeZone(date, timeZone) {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    const parts = formatter.formatToParts(date);
    const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));

    return `${values.year}-${values.month}-${values.day}`;
  } catch (error) {
    if (error instanceof RangeError && timeZone !== 'UTC') {
      return formatDateInTimeZone(date, 'UTC');
    }

    throw error;
  }
}

function getCheckInEventDate(createdAt, timeZone = DEFAULT_EVENT_TIME_ZONE) {
  if (!createdAt) {
    return null;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(createdAt)) {
    return createdAt;
  }

  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return formatDateInTimeZone(date, timeZone);
}

function checkInMatchesEventDate(createdAt, eventDate, timeZone = DEFAULT_EVENT_TIME_ZONE) {
  if (!eventDate) {
    return false;
  }

  return getCheckInEventDate(createdAt, timeZone) === eventDate;
}

module.exports = {
  checkInMatchesEventDate,
  getCheckInEventDate
};
