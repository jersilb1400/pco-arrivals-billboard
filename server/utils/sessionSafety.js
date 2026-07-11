const DEFAULT_EVENT_TIME_ZONE = process.env.EVENT_TIME_ZONE || 'America/Chicago';

function asNonEmptyString(value) {
  if (value === undefined || value === null) {
    return null;
  }
  const stringValue = String(value);
  return stringValue.length > 0 ? stringValue : null;
}

function shouldClearNotifications(currentBillboard, nextEventId, nextEventDate) {
  if (!currentBillboard) {
    return true;
  }

  return (
    String(currentBillboard.eventId) !== String(nextEventId) ||
    String(currentBillboard.eventDate) !== String(nextEventDate)
  );
}

function filterNotificationsForSession(notifications, eventId, eventDate) {
  return notifications.filter(
    notification =>
      String(notification.eventId) === String(eventId) &&
      String(notification.eventDate) === String(eventDate)
  );
}

function resolveNotificationScope(query, currentBillboard) {
  const eventId = asNonEmptyString(query.eventId);
  const eventDate = asNonEmptyString(query.eventDate);

  if ((eventId && !eventDate) || (!eventId && eventDate)) {
    return { error: 'eventId and eventDate must be provided together' };
  }

  if (eventId && eventDate) {
    return { eventId, eventDate };
  }

  if (currentBillboard?.eventId && currentBillboard?.eventDate) {
    return {
      eventId: String(currentBillboard.eventId),
      eventDate: String(currentBillboard.eventDate),
    };
  }

  return null;
}

function dateInTimeZone(value, timeZone = DEFAULT_EVENT_TIME_ZONE) {
  if (!value) {
    return null;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(date);
    const lookup = Object.fromEntries(parts.map(part => [part.type, part.value]));
    return `${lookup.year}-${lookup.month}-${lookup.day}`;
  } catch (error) {
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}

function isCheckInOnEventDate(createdAt, eventDate, timeZone = DEFAULT_EVENT_TIME_ZONE) {
  if (!eventDate) {
    return false;
  }

  return dateInTimeZone(createdAt, timeZone) === eventDate;
}

function buildCheckInCacheKey({ route, eventId, date = 'all', include = 'default' }) {
  return [
    `route:${route || 'unknown'}`,
    `event:${eventId || 'unknown'}`,
    `date:${date || 'all'}`,
    `include:${include || 'default'}`,
  ].join('|');
}

function removeCheckedOutNotifications(notifications, checkedOutIds) {
  const checkedOutIdSet = new Set(checkedOutIds.map(id => String(id)));
  return notifications.filter(notification => !checkedOutIdSet.has(String(notification.checkInId)));
}

module.exports = {
  buildCheckInCacheKey,
  dateInTimeZone,
  filterNotificationsForSession,
  isCheckInOnEventDate,
  removeCheckedOutNotifications,
  resolveNotificationScope,
  shouldClearNotifications,
};
