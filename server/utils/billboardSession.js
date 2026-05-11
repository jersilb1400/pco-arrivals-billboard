function normalizeSessionValue(value) {
  return value == null ? null : String(value);
}

function shouldClearNotifications(currentBillboard, nextEventId, nextEventDate) {
  if (!currentBillboard) {
    return true;
  }

  const currentEventId = normalizeSessionValue(currentBillboard.eventId);
  const currentEventDate = normalizeSessionValue(currentBillboard.eventDate);
  const eventId = normalizeSessionValue(nextEventId);
  const eventDate = normalizeSessionValue(nextEventDate);

  return currentEventId !== eventId || currentEventDate !== eventDate;
}

module.exports = {
  shouldClearNotifications
};
