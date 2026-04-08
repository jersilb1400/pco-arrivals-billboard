function normalizeEventId(eventId) {
  if (eventId === undefined || eventId === null) {
    return null;
  }
  return String(eventId);
}

function normalizeEventDate(eventDate) {
  if (eventDate === undefined || eventDate === null || eventDate === '') {
    return null;
  }
  return String(eventDate);
}

function shouldClearNotifications(currentActiveBillboard, nextEventId, nextEventDate) {
  if (!currentActiveBillboard) {
    return true;
  }

  const currentEventId = normalizeEventId(currentActiveBillboard.eventId);
  const currentEventDate = normalizeEventDate(currentActiveBillboard.eventDate);
  const incomingEventId = normalizeEventId(nextEventId);
  const incomingEventDate = normalizeEventDate(nextEventDate);

  return currentEventId !== incomingEventId || currentEventDate !== incomingEventDate;
}

module.exports = {
  shouldClearNotifications
};
