const DEFAULT_EVENT_TIME_ZONE = process.env.EVENT_TIME_ZONE || 'America/Chicago';

function normalizeDateOnly(value) {
  if (!value) {
    return null;
  }

  const stringValue = String(value);
  const dateMatch = stringValue.match(/^(\d{4}-\d{2}-\d{2})/);
  if (dateMatch) {
    return dateMatch[1];
  }

  return getEventDateInTimeZone(stringValue);
}

function normalizeScopeValue(value) {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  return String(value);
}

function getEventDateInTimeZone(value, timeZone = DEFAULT_EVENT_TIME_ZONE) {
  if (!value) {
    return null;
  }

  const stringValue = String(value);
  if (/^\d{4}-\d{2}-\d{2}$/.test(stringValue)) {
    return stringValue;
  }

  const date = new Date(stringValue);
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

    const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
    return `${values.year}-${values.month}-${values.day}`;
  } catch (error) {
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}

function isCheckInOnEventDate(createdAt, eventDate, timeZone = DEFAULT_EVENT_TIME_ZONE) {
  const checkInDate = getEventDateInTimeZone(createdAt, timeZone);
  const normalizedEventDate = normalizeDateOnly(eventDate);

  return Boolean(checkInDate && normalizedEventDate && checkInDate === normalizedEventDate);
}

function shouldClearNotifications(currentState, nextBillboard) {
  const currentBillboard = currentState?.activeBillboard;
  if (!currentBillboard) {
    return false;
  }

  const currentEventId = normalizeScopeValue(currentBillboard.eventId);
  const nextEventId = normalizeScopeValue(nextBillboard?.eventId);
  const currentEventDate = normalizeDateOnly(currentBillboard.eventDate);
  const nextEventDate = normalizeDateOnly(nextBillboard?.eventDate) || currentEventDate;

  return currentEventId !== nextEventId || currentEventDate !== nextEventDate;
}

function buildCheckInCacheKey({ route, eventId, date, include }) {
  return JSON.stringify({
    route: normalizeScopeValue(route),
    eventId: normalizeScopeValue(eventId),
    date: normalizeDateOnly(date),
    include: normalizeScopeValue(include),
  });
}

function resolveNotificationScope(query, currentState) {
  const requestedEventId = normalizeScopeValue(query?.eventId);
  const requestedEventDate = normalizeDateOnly(query?.eventDate);

  if (requestedEventId && requestedEventDate) {
    return {
      eventId: requestedEventId,
      eventDate: requestedEventDate,
    };
  }

  const activeBillboard = currentState?.activeBillboard;
  const activeEventId = normalizeScopeValue(activeBillboard?.eventId);
  const activeEventDate = normalizeDateOnly(activeBillboard?.eventDate);

  if (activeEventId && activeEventDate) {
    return {
      eventId: activeEventId,
      eventDate: activeEventDate,
    };
  }

  return null;
}

function filterNotificationsForScope(notifications, query, currentState) {
  const scope = resolveNotificationScope(query, currentState);
  if (!scope) {
    return [];
  }

  return notifications.filter((notification) => (
    normalizeScopeValue(notification.eventId) === scope.eventId &&
    normalizeDateOnly(notification.eventDate) === scope.eventDate
  ));
}

function pruneCheckedOutNotifications(notifications, checkedOutIds) {
  const checkedOutIdSet = new Set((checkedOutIds || []).map((id) => String(id)));

  return notifications.filter((notification) => (
    !checkedOutIdSet.has(String(notification.checkInId))
  ));
}

module.exports = {
  buildCheckInCacheKey,
  filterNotificationsForScope,
  getEventDateInTimeZone,
  isCheckInOnEventDate,
  pruneCheckedOutNotifications,
  shouldClearNotifications,
};
