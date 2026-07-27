function shouldClearNotifications(activeBillboard, nextEventId, nextEventDate) {
  if (
    !activeBillboard ||
    !activeBillboard.eventId ||
    !activeBillboard.eventDate ||
    !nextEventId ||
    !nextEventDate
  ) {
    return true;
  }

  return String(activeBillboard.eventId) !== String(nextEventId) ||
    String(activeBillboard.eventDate) !== String(nextEventDate);
}

function clearNotificationsForSession(
  notifications,
  activeBillboard,
  nextEventId,
  nextEventDate
) {
  if (!shouldClearNotifications(activeBillboard, nextEventId, nextEventDate)) {
    return 0;
  }

  const removed = notifications.length;
  notifications.length = 0;
  return removed;
}

module.exports = {
  clearNotificationsForSession,
  shouldClearNotifications
};
