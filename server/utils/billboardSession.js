function normalizeEventDate(eventDate) {
  return typeof eventDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(eventDate)
    ? eventDate
    : null;
}

function shouldClearNotifications(currentBillboard, nextEventId, nextEventDate) {
  if (!currentBillboard) {
    return false;
  }

  if (currentBillboard.eventId !== nextEventId) {
    return true;
  }

  const currentDate = normalizeEventDate(currentBillboard.eventDate);
  const nextDate = normalizeEventDate(nextEventDate) || currentDate;

  return currentDate !== nextDate;
}

module.exports = {
  shouldClearNotifications
};
