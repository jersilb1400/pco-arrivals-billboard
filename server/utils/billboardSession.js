function normalize(value) {
  return value == null ? '' : String(value);
}

function resolveNextEventDate(currentBillboard, nextEventDate) {
  if (nextEventDate) {
    return nextEventDate;
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
