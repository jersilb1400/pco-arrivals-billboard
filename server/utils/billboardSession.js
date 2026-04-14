function shouldClearNotifications(activeBillboard, nextEventId, nextEventDate) {
  if (!activeBillboard) {
    return false;
  }

  const currentEventId = String(activeBillboard.eventId || '');
  const incomingEventId = String(nextEventId || '');
  const currentEventDate = String(activeBillboard.eventDate || '');
  const incomingEventDate = String(nextEventDate || '');

  return currentEventId !== incomingEventId || currentEventDate !== incomingEventDate;
}

module.exports = {
  shouldClearNotifications
};
