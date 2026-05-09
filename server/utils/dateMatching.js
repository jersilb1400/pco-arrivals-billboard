function formatLocalDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function isValidEventDate(eventDate) {
  return typeof eventDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(eventDate);
}

function isSameEventDate(createdAt, eventDate) {
  if (!createdAt || !isValidEventDate(eventDate)) {
    return false;
  }

  if (typeof createdAt === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(createdAt)) {
    return createdAt === eventDate;
  }

  const parsedDate = new Date(createdAt);
  if (Number.isNaN(parsedDate.getTime())) {
    return false;
  }

  const utcDate = parsedDate.toISOString().slice(0, 10);
  const localDate = formatLocalDate(parsedDate);

  return eventDate === utcDate || eventDate === localDate;
}

module.exports = {
  isSameEventDate
};
