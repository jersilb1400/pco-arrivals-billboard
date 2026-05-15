function shouldClearNotifications(currentState, nextSession) {
  const currentBillboard = currentState?.activeBillboard;
  if (!currentBillboard) {
    return true;
  }

  return String(currentBillboard.eventId) !== String(nextSession.eventId) ||
    String(currentBillboard.eventDate || '') !== String(nextSession.eventDate || '');
}

module.exports = {
  shouldClearNotifications
};
