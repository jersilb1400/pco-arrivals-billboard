function normalizeValue(value) {
  return value == null ? '' : String(value);
}

function resolveNotificationScope(query = {}, activeBillboard = null) {
  return {
    eventId: query.eventId || activeBillboard?.eventId || null,
    eventDate: query.eventDate || query.date || activeBillboard?.eventDate || null
  };
}

function filterNotificationsForScope(notifications, scope) {
  if (!scope?.eventId || !scope?.eventDate) {
    return [];
  }

  return notifications.filter(notification =>
    normalizeValue(notification.eventId) === normalizeValue(scope.eventId) &&
    normalizeValue(notification.eventDate) === normalizeValue(scope.eventDate)
  );
}

module.exports = {
  resolveNotificationScope,
  filterNotificationsForScope
};
