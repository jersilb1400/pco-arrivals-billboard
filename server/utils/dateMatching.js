const DEFAULT_EVENT_TIME_ZONE = process.env.EVENT_TIME_ZONE || 'America/Chicago';

function isIsoDate(value) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function formatDateInTimeZone(value, timeZone = DEFAULT_EVENT_TIME_ZONE) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });

  const parts = formatter.formatToParts(date).reduce((acc, part) => {
    acc[part.type] = part.value;
    return acc;
  }, {});

  return `${parts.year}-${parts.month}-${parts.day}`;
}

function isCheckInOnEventDate(createdAt, eventDate, timeZone = DEFAULT_EVENT_TIME_ZONE) {
  if (!createdAt || !isIsoDate(eventDate)) {
    return false;
  }

  if (isIsoDate(createdAt)) {
    return createdAt === eventDate;
  }

  try {
    return formatDateInTimeZone(createdAt, timeZone) === eventDate;
  } catch (error) {
    if (error instanceof RangeError) {
      return formatDateInTimeZone(createdAt, 'UTC') === eventDate;
    }
    throw error;
  }
}

module.exports = {
  isCheckInOnEventDate
};
