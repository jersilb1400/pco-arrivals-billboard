function normalizeValue(value) {
  return value == null ? '' : String(value);
}

function resolveNotificationScope(query = {}, activeBillboard = null) {
  const requestedEventId = query.eventId || null;
  const requestedEventDate = query.eventDate || query.date || null;

  if (requestedEventId && requestedEventDate) {
    return {
      eventId: requestedEventId,
      eventDate: requestedEventDate
    };
  }

  if (!requestedEventId && !requestedEventDate) {
    return {
      eventId: activeBillboard?.eventId || null,
      eventDate: activeBillboard?.eventDate || null
    };
  }

  if (
    requestedEventId &&
    activeBillboard?.eventDate &&
    normalizeValue(requestedEventId) === normalizeValue(activeBillboard.eventId)
  ) {
    return {
      eventId: requestedEventId,
      eventDate: activeBillboard.eventDate
    };
  }

  if (
    requestedEventDate &&
    activeBillboard?.eventId &&
    normalizeValue(requestedEventDate) === normalizeValue(activeBillboard.eventDate)
  ) {
    return {
      eventId: activeBillboard.eventId,
      eventDate: requestedEventDate
    };
  }

  return {
    eventId: null,
    eventDate: null
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
