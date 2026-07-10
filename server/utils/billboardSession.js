function shouldClearNotifications(currentBillboard, nextEventId, nextEventDate) {
  if (!currentBillboard) {
    return false;
  }

  return currentBillboard.eventId !== nextEventId ||
    (currentBillboard.eventDate || '') !== (nextEventDate || '');
}

module.exports = {
  shouldClearNotifications
};
