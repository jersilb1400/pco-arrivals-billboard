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

  return year && month && day ? `${year}-${month}-${day}` : null;
}

function isSameEventDate(createdAt, eventDate, timeZone = DEFAULT_EVENT_TIME_ZONE) {
  if (!createdAt || !eventDate || !/^\d{4}-\d{2}-\d{2}$/.test(eventDate)) {
    return false;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(createdAt)) {
    return createdAt === eventDate;
  }

  const createdAtDate = new Date(createdAt);
  if (Number.isNaN(createdAtDate.getTime())) {
    return false;
  }

  try {
    return formatDateInTimeZone(createdAtDate, timeZone) === eventDate;
  } catch (error) {
    console.warn(`Invalid event timezone "${timeZone}", falling back to UTC`);
    return formatDateInTimeZone(createdAtDate, 'UTC') === eventDate;
  }
}

module.exports = {
  DEFAULT_EVENT_TIME_ZONE,
  isSameEventDate
};
