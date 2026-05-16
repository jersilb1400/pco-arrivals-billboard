function normalizeSession(session) {
  if (!session) {
    return null;
  }

  return {
    eventId: session.eventId == null ? null : String(session.eventId),
    eventDate: session.eventDate || null
  };
}

function shouldClearNotifications(currentBillboard, nextBillboard) {
  const current = normalizeSession(currentBillboard);
  const next = normalizeSession(nextBillboard);

  if (!current || !next) {
    return true;
  }

  return current.eventId !== next.eventId || current.eventDate !== next.eventDate;
}

module.exports = {
  shouldClearNotifications
};
