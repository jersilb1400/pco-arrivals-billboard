function normalizeSessionValue(value) {
  if (value === undefined || value === null) return '';
  return String(value);
}

function isSameBillboardSession(currentBillboard, nextEventId, nextEventDate) {
  if (!currentBillboard) return false;

  return (
    normalizeSessionValue(currentBillboard.eventId) === normalizeSessionValue(nextEventId) &&
    normalizeSessionValue(currentBillboard.eventDate) === normalizeSessionValue(nextEventDate)
  );
}

function shouldClearNotifications(currentBillboard, nextEventId, nextEventDate) {
  // If we cannot prove the same session, clear to avoid mixing stale requests.
  if (!currentBillboard) return true;
  return !isSameBillboardSession(currentBillboard, nextEventId, nextEventDate);
}

module.exports = {
  isSameBillboardSession,
  shouldClearNotifications
};
