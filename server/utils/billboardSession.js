function normalizeSessionValue(value) {
  return value === undefined || value === null ? '' : String(value);
}

function shouldClearNotifications(currentBillboard, nextEventId, nextEventDate) {
  if (!currentBillboard) {
    return true;
  }

  return normalizeSessionValue(currentBillboard.eventId) !== normalizeSessionValue(nextEventId) ||
    normalizeSessionValue(currentBillboard.eventDate) !== normalizeSessionValue(nextEventDate);
}

module.exports = {
  shouldClearNotifications
};
