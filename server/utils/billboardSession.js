function resolveNextEventDate(currentBillboard, nextEventId, nextEventDate) {
  if (nextEventDate) {
    return nextEventDate;
  }

  if (currentBillboard && String(currentBillboard.eventId) === String(nextEventId)) {
    return currentBillboard.eventDate;
  }

  return nextEventDate;
}

function shouldClearNotifications(currentBillboard, nextEventId, nextEventDate) {
  const resolvedNextEventDate = resolveNextEventDate(currentBillboard, nextEventId, nextEventDate);

  if (!currentBillboard?.eventId) {
    return true;
  }

  if (String(currentBillboard.eventId) !== String(nextEventId)) {
    return true;
  }

  if (currentBillboard.eventDate || resolvedNextEventDate) {
    return String(currentBillboard.eventDate || '') !== String(resolvedNextEventDate || '');
  }

  return false;
}

module.exports = {
  resolveNextEventDate,
  shouldClearNotifications
};
