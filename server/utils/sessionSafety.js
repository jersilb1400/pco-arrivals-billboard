const DEFAULT_EVENT_TIME_ZONE = process.env.EVENT_TIME_ZONE || 'America/Chicago';

function normalizeDate(value, timeZone = DEFAULT_EVENT_TIME_ZONE) {
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
      day: '2-digit'
    }).formatToParts(date);
    const partByType = Object.fromEntries(parts.map(part => [part.type, part.value]));
    return `${partByType.year}-${partByType.month}-${partByType.day}`;
  } catch (error) {
    return date.toISOString().slice(0, 10);
  }
}

function isCheckInOnEventDate(createdAt, eventDate, timeZone = DEFAULT_EVENT_TIME_ZONE) {
  const checkInDate = normalizeDate(createdAt, timeZone);
  const normalizedEventDate = normalizeDate(eventDate, timeZone);

  return !!checkInDate && !!normalizedEventDate && checkInDate === normalizedEventDate;
}

function normalizeInclude(include) {
  if (!include) {
    return 'no-include';
  }

  return String(include)
    .split(',')
    .map(value => value.trim())
    .filter(Boolean)
    .sort()
    .join(',');
}

function buildCheckInCacheKey({ route, eventId, date, include }) {
  return [
    route || 'unknown-route',
    eventId || 'unknown-event',
    date || 'all-dates',
    normalizeInclude(include)
  ].join('|');
}

function resolveNextEventDate(nextEventDate, currentBillboard, nextEventId) {
  if (nextEventDate) {
    return nextEventDate;
  }

  if (
    currentBillboard?.eventDate &&
    currentBillboard?.eventId &&
    String(currentBillboard.eventId) === String(nextEventId)
  ) {
    return currentBillboard.eventDate;
  }

  return nextEventDate;
}

function shouldClearNotifications(currentBillboard, nextBillboard) {
  if (!currentBillboard) {
    return true;
  }

  return (
    String(currentBillboard.eventId) !== String(nextBillboard.eventId) ||
    String(currentBillboard.eventDate || '') !== String(nextBillboard.eventDate || '')
  );
}

function filterNotificationsForScope(notifications, scope) {
  if (!Array.isArray(notifications) || !scope?.eventId || !scope?.eventDate) {
    return [];
  }

  return notifications.filter(notification =>
    String(notification.eventId) === String(scope.eventId) &&
    String(notification.eventDate) === String(scope.eventDate)
  );
}

function pruneCheckedOutNotifications(notifications, checkedOutIds) {
  const checkedOutIdSet = new Set((checkedOutIds || []).map(id => String(id)));
  return (notifications || []).filter(notification =>
    !checkedOutIdSet.has(String(notification.checkInId))
  );
}

module.exports = {
  buildCheckInCacheKey,
  filterNotificationsForScope,
  isCheckInOnEventDate,
  pruneCheckedOutNotifications,
  resolveNextEventDate,
  shouldClearNotifications
};
