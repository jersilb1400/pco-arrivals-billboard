function normalize(value) {
  return value == null ? '' : String(value);
}

function resolveNextEventDate(currentBillboard, nextEventId, nextEventDate) {
  if (nextEventDate) {
    return nextEventDate;
  }

  if (normalize(currentBillboard?.eventId) !== normalize(nextEventId)) {
    return null;
  }

  return currentBillboard?.eventDate || null;
}

function shouldClearNotifications(currentBillboard, nextEventId, nextEventDate) {
  if (!currentBillboard) {
    return false;
  }

  return normalize(currentBillboard.eventId) !== normalize(nextEventId) ||
    normalize(currentBillboard.eventDate) !== normalize(nextEventDate);
}

module.exports = {
  resolveNextEventDate,
  shouldClearNotifications
};
