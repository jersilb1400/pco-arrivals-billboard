function normalizeDate(value) {
  return value || null;
}

function shouldClearNotifications(currentBillboard, nextEventId, nextEventDate) {
  if (!currentBillboard) {
    return false;
  }

  if (String(currentBillboard.eventId) !== String(nextEventId)) {
    return true;
  }

  return normalizeDate(currentBillboard.eventDate) !== normalizeDate(nextEventDate);
}

module.exports = {
  shouldClearNotifications
};
