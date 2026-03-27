function getPossibleDateStrings(value) {
  const out = new Set();
  if (!value) return out;

  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    out.add(value);
    return out;
  }

  const dateObj = new Date(value);
  if (Number.isNaN(dateObj.getTime())) return out;

  const utcYear = dateObj.getUTCFullYear();
  const utcMonth = String(dateObj.getUTCMonth() + 1).padStart(2, '0');
  const utcDay = String(dateObj.getUTCDate()).padStart(2, '0');
  out.add(`${utcYear}-${utcMonth}-${utcDay}`);

  const localYear = dateObj.getFullYear();
  const localMonth = String(dateObj.getMonth() + 1).padStart(2, '0');
  const localDay = String(dateObj.getDate()).padStart(2, '0');
  out.add(`${localYear}-${localMonth}-${localDay}`);

  return out;
}

function matchesEventDate(createdAt, eventDate) {
  if (!eventDate || !/^\d{4}-\d{2}-\d{2}$/.test(eventDate)) {
    return false;
  }
  return getPossibleDateStrings(createdAt).has(eventDate);
}

module.exports = {
  getPossibleDateStrings,
  matchesEventDate
};
