function normalizeSessionValue(value) {
  return value === undefined || value === null ? '' : String(value);
}

function shouldClearNotifications(currentBillboard, nextSession) {
  if (!nextSession?.eventId) {
    return false;
  }

  if (!currentBillboard?.eventId) {
    return true;
  }

  return normalizeSessionValue(currentBillboard.eventId) !== normalizeSessionValue(nextSession.eventId) ||
    normalizeSessionValue(currentBillboard.eventDate) !== normalizeSessionValue(nextSession.eventDate);
}

module.exports = { shouldClearNotifications };
