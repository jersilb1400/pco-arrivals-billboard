function resolveNextEventDate(eventDate, currentState) {
  return eventDate || currentState?.activeBillboard?.eventDate || null;
}

function shouldClearNotifications(currentState, nextEventId, nextEventDate) {
  const currentBillboard = currentState?.activeBillboard;

  if (!currentBillboard) {
    return false;
  }

  return String(currentBillboard.eventId) !== String(nextEventId) ||
    String(currentBillboard.eventDate || '') !== String(nextEventDate || '');
}

function filterNotificationsForSession(notifications, eventId, eventDate) {
  return notifications.filter(notification =>
    String(notification.eventId) === String(eventId) &&
    String(notification.eventDate || '') === String(eventDate || '')
  );
}

function isActiveBillboardRequest(currentState, eventId, eventDate) {
  const activeBillboard = currentState?.activeBillboard;

  if (!activeBillboard || !eventId || !eventDate) {
    return false;
  }

  return String(activeBillboard.eventId) === String(eventId) &&
    String(activeBillboard.eventDate || '') === String(eventDate || '');
}

module.exports = {
  resolveNextEventDate,
  shouldClearNotifications,
  filterNotificationsForSession,
  isActiveBillboardRequest
};
