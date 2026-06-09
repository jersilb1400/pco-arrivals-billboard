function normalizeSessionValue(value) {
  return value == null ? '' : String(value);
}

function resolveNextEventDate(nextEventDate, currentBillboard, nextEventId) {
  if (nextEventDate) {
    return nextEventDate;
  }

  if (
    currentBillboard &&
    normalizeSessionValue(currentBillboard.eventId) === normalizeSessionValue(nextEventId)
  ) {
    return currentBillboard.eventDate;
  }

  return nextEventDate;
}

function shouldClearNotifications(currentBillboard, nextEventId, nextEventDate) {
  if (!currentBillboard) {
    return true;
  }

  return (
    normalizeSessionValue(currentBillboard.eventId) !== normalizeSessionValue(nextEventId) ||
    normalizeSessionValue(currentBillboard.eventDate) !== normalizeSessionValue(nextEventDate)
  );
}

module.exports = {
  resolveNextEventDate,
  shouldClearNotifications
};
