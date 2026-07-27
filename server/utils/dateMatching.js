/**
 * Derive possible calendar date strings (YYYY-MM-DD) from a timestamp.
 * Includes both UTC and local interpretations so timezone edges near midnight
 * can still match the intended event date without admitting adjacent days.
 */
function getPossibleDateStrings(createdAt) {
  const dates = new Set();
  if (!createdAt) {
    return dates;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(createdAt)) {
    dates.add(createdAt);
    return dates;
  }

  const dateObj = new Date(createdAt);
  if (Number.isNaN(dateObj.getTime())) {
    return dates;
  }

  const format = (useUTC) => {
    const year = useUTC ? dateObj.getUTCFullYear() : dateObj.getFullYear();
    const month = String((useUTC ? dateObj.getUTCMonth() : dateObj.getMonth()) + 1).padStart(2, '0');
    const day = String(useUTC ? dateObj.getUTCDate() : dateObj.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  dates.add(format(true));
  dates.add(format(false));
  return dates;
}

function matchesEventDate(createdAt, eventDate) {
  if (!eventDate) {
    return false;
  }
  return getPossibleDateStrings(createdAt).has(eventDate);
}

module.exports = {
  getPossibleDateStrings,
  matchesEventDate
};
