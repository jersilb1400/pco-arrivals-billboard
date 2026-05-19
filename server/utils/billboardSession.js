function shouldClearNotifications(activeBillboard, nextEventId, nextEventDate) {
  if (!activeBillboard) {
    return true;
  }

  return String(activeBillboard.eventId) !== String(nextEventId) ||
    String(activeBillboard.eventDate || '') !== String(nextEventDate || '');
}

module.exports = {
  shouldClearNotifications
};
