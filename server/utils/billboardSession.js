function normalizeSessionValue(value) {
  return value == null ? '' : String(value);
}

function shouldClearNotifications(currentBillboard, nextBillboard) {
  if (!nextBillboard?.eventId) {
    return false;
  }

  if (!currentBillboard) {
    return true;
  }

  return normalizeSessionValue(currentBillboard.eventId) !== normalizeSessionValue(nextBillboard.eventId) ||
    normalizeSessionValue(currentBillboard.eventDate) !== normalizeSessionValue(nextBillboard.eventDate);
}

module.exports = {
  shouldClearNotifications
};
