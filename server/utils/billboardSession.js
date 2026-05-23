function normalizeValue(value) {
  return value === undefined || value === null ? '' : String(value);
}

function shouldClearNotifications(currentState, nextEventId, nextEventDate) {
  const currentBillboard = currentState?.activeBillboard;
  if (!currentBillboard) {
    return true;
  }

  return (
    normalizeValue(currentBillboard.eventId) !== normalizeValue(nextEventId) ||
    normalizeValue(currentBillboard.eventDate) !== normalizeValue(nextEventDate)
  );
}

module.exports = {
  shouldClearNotifications
};
