function shouldClearNotificationsForBillboardChange(currentBillboard, nextEventId, nextEventDate) {
  if (!currentBillboard) {
    return true;
  }

  return (
    String(currentBillboard.eventId) !== String(nextEventId) ||
    String(currentBillboard.eventDate || '') !== String(nextEventDate || '')
  );
}

module.exports = {
  shouldClearNotificationsForBillboardChange
};
