const DEFAULT_EVENT_TIME_ZONE = 'America/Chicago';
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function formatDateInTimeZone(date, timeZone = process.env.EVENT_TIME_ZONE || DEFAULT_EVENT_TIME_ZONE) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(date);

  const values = Object.fromEntries(parts.map(part => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function isCheckInOnEventDate(checkInCreatedAt, eventDate, timeZone) {
  if (!checkInCreatedAt || !eventDate || !ISO_DATE_PATTERN.test(eventDate)) {
    return false;
  }

  if (ISO_DATE_PATTERN.test(checkInCreatedAt)) {
    return checkInCreatedAt === eventDate;
  }

  const checkInDate = new Date(checkInCreatedAt);
  if (Number.isNaN(checkInDate.getTime())) {
    return false;
  }

  return formatDateInTimeZone(checkInDate, timeZone) === eventDate;
}

module.exports = {
  DEFAULT_EVENT_TIME_ZONE,
  formatDateInTimeZone,
  isCheckInOnEventDate
};
