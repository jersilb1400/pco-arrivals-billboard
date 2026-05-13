function shouldClearNotifications(currentState, nextEventId, nextEventDate) {
  const activeBillboard = currentState?.activeBillboard;

  if (!activeBillboard) {
    return false;
  }

  return String(activeBillboard.eventId) !== String(nextEventId) ||
    String(activeBillboard.eventDate || '') !== String(nextEventDate || '');
}

module.exports = {
  shouldClearNotifications
};
