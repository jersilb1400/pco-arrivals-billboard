const DEFAULT_EVENT_TIME_ZONE = process.env.EVENT_TIME_ZONE || 'America/Chicago';

function formatDatePart(date, useUtc) {
  const year = useUtc ? date.getUTCFullYear() : date.getFullYear();
  const month = String((useUtc ? date.getUTCMonth() : date.getMonth()) + 1).padStart(2, '0');
  const day = String(useUtc ? date.getUTCDate() : date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatDateInTimeZone(date, timeZone) {
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).formatToParts(date);

    const values = Object.fromEntries(parts.map(part => [part.type, part.value]));
    return `${values.year}-${values.month}-${values.day}`;
  } catch (error) {
    return formatDatePart(date, false);
  }
}

function getCheckInDateCandidates(createdAt, timeZone = DEFAULT_EVENT_TIME_ZONE) {
  if (!createdAt || typeof createdAt !== 'string') {
    return [];
  }

  const candidates = new Set();
  const sourceDate = createdAt.match(/^(\d{4}-\d{2}-\d{2})$/);
  if (sourceDate) {
    candidates.add(sourceDate[1]);
    return Array.from(candidates);
  }

  const offsetTimestamp = createdAt.match(/^(\d{4}-\d{2}-\d{2})T.*[+-]\d{2}:?\d{2}$/);
  if (offsetTimestamp) {
    candidates.add(offsetTimestamp[1]);
  }

  const parsedDate = new Date(createdAt);
  if (!Number.isNaN(parsedDate.getTime())) {
    candidates.add(formatDateInTimeZone(parsedDate, timeZone));
  }

  return Array.from(candidates);
}

function checkInMatchesEventDate(createdAt, eventDate, timeZone = DEFAULT_EVENT_TIME_ZONE) {
  if (!eventDate || !/^\d{4}-\d{2}-\d{2}$/.test(eventDate)) {
    return false;
  }

  return getCheckInDateCandidates(createdAt, timeZone).includes(eventDate);
}

module.exports = {
  checkInMatchesEventDate,
  getCheckInDateCandidates
};
