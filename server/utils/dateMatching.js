const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const DEFAULT_EVENT_TIME_ZONE = process.env.EVENT_TIME_ZONE || 'America/Chicago';

function getEventDateString(createdAt, timeZone = DEFAULT_EVENT_TIME_ZONE) {
  if (typeof createdAt !== 'string' || createdAt.length === 0) {
    return null;
  }

  if (DATE_ONLY_PATTERN.test(createdAt)) {
    return createdAt;
  }

  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(date);

  const year = parts.find(part => part.type === 'year')?.value;
  const month = parts.find(part => part.type === 'month')?.value;
  const day = parts.find(part => part.type === 'day')?.value;

  if (!year || !month || !day) {
    return null;
  }

  return `${year}-${month}-${day}`;
}

function isSameEventDate(createdAt, eventDate, timeZone = DEFAULT_EVENT_TIME_ZONE) {
  if (!DATE_ONLY_PATTERN.test(eventDate || '')) {
    return false;
  }

  return getEventDateString(createdAt, timeZone) === eventDate;
}

module.exports = {
  getEventDateString,
  isSameEventDate
};
