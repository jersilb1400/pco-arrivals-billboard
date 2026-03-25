function shouldClearNotificationsForSessionChange(previousBillboard, nextEventId, nextEventDate) {
  if (!previousBillboard) {
    return true;
  }

  const sameEventId = String(previousBillboard.eventId) === String(nextEventId);
  const sameEventDate = String(previousBillboard.eventDate || '') === String(nextEventDate || '');

  return !(sameEventId && sameEventDate);
}

module.exports = {
  shouldClearNotificationsForSessionChange
};
