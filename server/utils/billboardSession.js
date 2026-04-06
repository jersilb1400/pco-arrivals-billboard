function normalizeEventDate(eventDate) {
  if (!eventDate) return null;

  const rawValue = String(eventDate).trim();
  if (!rawValue) return null;

  if (/^\d{4}-\d{2}-\d{2}$/.test(rawValue)) {
    return rawValue;
  }

  const parsedDate = new Date(rawValue);
  if (!Number.isNaN(parsedDate.getTime())) {
    return parsedDate.toISOString().split('T')[0];
  }

  return rawValue;
}

function isSameBillboardSession(previousBillboard, nextEventId, nextEventDate) {
  if (!previousBillboard || !nextEventId) return false;

  const previousEventId = String(previousBillboard.eventId);
  const upcomingEventId = String(nextEventId);
  if (previousEventId !== upcomingEventId) return false;

  const previousDate = normalizeEventDate(previousBillboard.eventDate);
  const upcomingDate = normalizeEventDate(nextEventDate);
  return previousDate === upcomingDate;
}

function shouldClearNotifications(previousBillboard, nextEventId, nextEventDate) {
  return !isSameBillboardSession(previousBillboard, nextEventId, nextEventDate);
}

module.exports = {
  normalizeEventDate,
  isSameBillboardSession,
  shouldClearNotifications
};
