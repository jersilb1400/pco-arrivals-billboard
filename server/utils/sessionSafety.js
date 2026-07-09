function normalizeSession(billboard) {
  if (!billboard || !billboard.eventId || !billboard.eventDate) {
    return null;
  }

  return {
    eventId: String(billboard.eventId),
    eventDate: String(billboard.eventDate),
  };
}

function shouldClearNotifications(currentBillboard, nextBillboard) {
  const currentSession = normalizeSession(currentBillboard);
  const nextSession = normalizeSession(nextBillboard);

  if (!nextSession) {
    return false;
  }

  if (!currentSession) {
    return true;
  }

  return currentSession.eventId !== nextSession.eventId ||
    currentSession.eventDate !== nextSession.eventDate;
}

module.exports = {
  shouldClearNotifications,
};
