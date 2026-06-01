function normalizeValue(value) {
  return value === undefined || value === null ? '' : String(value);
}

function resolvePublicEventContext(activeBillboard, requested = {}) {
  const activeEventId = normalizeValue(activeBillboard?.eventId);
  const activeEventDate = normalizeValue(activeBillboard?.eventDate);

  if (!activeEventId || !activeEventDate) {
    return {
      ok: false,
      status: 409,
      error: 'No active billboard event'
    };
  }

  const requestedEventId = normalizeValue(requested.eventId);
  const requestedEventDate = normalizeValue(requested.eventDate || requested.date);

  if (
    (requestedEventId && requestedEventId !== activeEventId) ||
    (requestedEventDate && requestedEventDate !== activeEventDate)
  ) {
    return {
      ok: false,
      status: 403,
      error: 'Requested event does not match the active billboard event'
    };
  }

  return {
    ok: true,
    eventId: activeEventId,
    eventDate: activeEventDate
  };
}

module.exports = {
  resolvePublicEventContext
};
