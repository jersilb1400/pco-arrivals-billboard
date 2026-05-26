function normalizeSessionValue(value) {
  return value === undefined || value === null ? '' : String(value);
}

function shouldClearNotifications(currentBillboard, nextBillboard) {
  if (!currentBillboard) {
    return true;
  }

  return (
    normalizeSessionValue(currentBillboard.eventId) !== normalizeSessionValue(nextBillboard.eventId) ||
    normalizeSessionValue(currentBillboard.eventDate) !== normalizeSessionValue(nextBillboard.eventDate)
  );
}

module.exports = {
  shouldClearNotifications
};
