function normalizeDate(value) {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function resolveNextEventDate(currentBillboard, incomingEventDate) {
  return normalizeDate(incomingEventDate) || normalizeDate(currentBillboard?.eventDate);
}

function shouldClearNotifications(currentBillboard, nextEventId, nextEventDate) {
  if (!currentBillboard) {
    return false;
  }

  return String(currentBillboard.eventId) !== String(nextEventId) ||
    String(normalizeDate(currentBillboard.eventDate) || '') !== String(normalizeDate(nextEventDate) || '');
}

module.exports = {
  resolveNextEventDate,
  shouldClearNotifications
};
