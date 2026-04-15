function shouldClearNotifications(currentBillboard, nextEventId, nextEventDate) {
  if (!currentBillboard) {
    return true;
  }

  const currentEventId = String(currentBillboard.eventId || '');
  const currentEventDate = String(currentBillboard.eventDate || '');
  const requestedEventId = String(nextEventId || '');
  const requestedEventDate = String(nextEventDate || '');

  return currentEventId !== requestedEventId || currentEventDate !== requestedEventDate;
}

module.exports = { shouldClearNotifications };
