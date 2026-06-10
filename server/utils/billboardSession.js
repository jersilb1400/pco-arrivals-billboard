function hasValue(value) {
  return value !== undefined && value !== null && value !== '';
}

function notificationMatchesBillboardSession(notification, eventId, eventDate) {
  if (!hasValue(notification?.eventId) || String(notification.eventId) !== String(eventId)) {
    return false;
  }

  if (hasValue(eventDate)) {
    return String(notification.eventDate) === String(eventDate);
  }

  return !hasValue(notification.eventDate);
}

function filterNotificationsForBillboardSession(notifications, eventId, eventDate) {
  return notifications.filter(notification =>
    notificationMatchesBillboardSession(notification, eventId, eventDate)
  );
}

function withoutCheckedOutNotifications(notifications, checkedOutIds) {
  const checkedOutIdSet = new Set(checkedOutIds.map(id => String(id)));
  return notifications.filter(notification => !checkedOutIdSet.has(String(notification.checkInId)));
}

function getEffectiveNotificationScope(query, activeBillboard) {
  const { eventId, eventDate } = query;

  if (hasValue(eventId) && hasValue(eventDate)) {
    return { eventId, eventDate };
  }

  if (!hasValue(eventId) && !hasValue(eventDate) &&
      hasValue(activeBillboard?.eventId) && hasValue(activeBillboard?.eventDate)) {
    return {
      eventId: activeBillboard.eventId,
      eventDate: activeBillboard.eventDate
    };
  }

  return null;
}

function getCheckInCacheKey(eventId, date, purpose) {
  const scope = `${eventId}::${hasValue(date) ? date : 'all'}`;
  return hasValue(purpose) ? `${purpose}::${scope}` : scope;
}

module.exports = {
  filterNotificationsForBillboardSession,
  getCheckInCacheKey,
  getEffectiveNotificationScope,
  notificationMatchesBillboardSession,
  withoutCheckedOutNotifications
};
