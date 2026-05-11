function formatDatePart(date, useUtc) {
  const year = useUtc ? date.getUTCFullYear() : date.getFullYear();
  const month = String((useUtc ? date.getUTCMonth() : date.getMonth()) + 1).padStart(2, '0');
  const day = String(useUtc ? date.getUTCDate() : date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getCheckInDateCandidates(createdAt) {
  if (!createdAt || typeof createdAt !== 'string') {
    return [];
  }

  const candidates = new Set();
  const sourceDate = createdAt.match(/^(\d{4}-\d{2}-\d{2})/);
  if (sourceDate) {
    candidates.add(sourceDate[1]);
  }

  const parsedDate = new Date(createdAt);
  if (!Number.isNaN(parsedDate.getTime())) {
    candidates.add(formatDatePart(parsedDate, true));
    candidates.add(formatDatePart(parsedDate, false));
  }

  return Array.from(candidates);
}

function checkInMatchesEventDate(createdAt, eventDate) {
  if (!eventDate || !/^\d{4}-\d{2}-\d{2}$/.test(eventDate)) {
    return false;
  }

  return getCheckInDateCandidates(createdAt).includes(eventDate);
}

module.exports = {
  checkInMatchesEventDate,
  getCheckInDateCandidates
};
