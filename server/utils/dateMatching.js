const DEFAULT_EVENT_TIME_ZONE = process.env.EVENT_TIME_ZONE || 'America/Chicago';

function formatDateInTimeZone(date, timeZone = DEFAULT_EVENT_TIME_ZONE) {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  const parts = formatter.formatToParts(date).reduce((acc, part) => {
    acc[part.type] = part.value;
    return acc;
  }, {});

  return `${parts.year}-${parts.month}-${parts.day}`;
}

function isCheckInOnEventDate(createdAt, eventDate, timeZone = DEFAULT_EVENT_TIME_ZONE) {
  if (!createdAt || !eventDate) {
    return false;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(createdAt)) {
    return createdAt === eventDate;
  }

  const createdDate = new Date(createdAt);
  if (Number.isNaN(createdDate.getTime())) {
    return false;
  }

  try {
    return formatDateInTimeZone(createdDate, timeZone) === eventDate;
  } catch (error) {
    return formatDateInTimeZone(createdDate, 'UTC') === eventDate;
  }
}

module.exports = {
  DEFAULT_EVENT_TIME_ZONE,
  formatDateInTimeZone,
  isCheckInOnEventDate,
};
