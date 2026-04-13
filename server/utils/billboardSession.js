function shouldClearNotifications(currentBillboard, nextEventId, nextEventDate) {
  if (!currentBillboard) {
    return true;
  }

  const currentEventId = String(currentBillboard.eventId || '');
  const incomingEventId = String(nextEventId || '');
  if (currentEventId !== incomingEventId) {
    return true;
  }

  const currentEventDate = String(currentBillboard.eventDate || '');
  const incomingEventDate = String(nextEventDate || '');
  return currentEventDate !== incomingEventDate;
}

module.exports = {
  shouldClearNotifications
};
