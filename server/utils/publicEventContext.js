function normalizeContextValue(value) {
  return value === undefined || value === null ? '' : String(value);
}

function resolvePublicEventContext(activeBillboard, requested = {}) {
  const activeEventId = normalizeContextValue(activeBillboard?.eventId);
  const activeEventDate = normalizeContextValue(activeBillboard?.eventDate);

  if (!activeEventId || !activeEventDate) {
    return {
      ok: false,
      status: 409,
      error: 'No active billboard event'
    };
  }

  const requestedEventId = normalizeContextValue(requested.eventId);
  const requestedEventDate = normalizeContextValue(requested.eventDate || requested.date);

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
