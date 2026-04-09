function normalize(value) {
  if (value === undefined || value === null) return null;
  const asString = String(value).trim();
  return asString.length > 0 ? asString : null;
}

function shouldClearNotifications(currentBillboard, nextEventId, nextEventDate) {
  if (!currentBillboard) return true;

  const currentEventId = normalize(currentBillboard.eventId);
  const incomingEventId = normalize(nextEventId);
  if (!currentEventId || !incomingEventId) return true;
  if (currentEventId !== incomingEventId) return true;

  const currentEventDate = normalize(currentBillboard.eventDate);
  const incomingEventDate = normalize(nextEventDate);

  // If one side has a date and the other does not, treat as a session change.
  if (currentEventDate !== incomingEventDate) return true;

  return false;
}

module.exports = {
  shouldClearNotifications
};
