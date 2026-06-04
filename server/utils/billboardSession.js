function resolveNextEventDate(currentBillboard, nextBillboard) {
  if (nextBillboard?.eventDate) {
    return nextBillboard.eventDate;
  }

  if (
    currentBillboard?.eventDate &&
    nextBillboard?.eventId &&
    String(currentBillboard.eventId) === String(nextBillboard.eventId)
  ) {
    return currentBillboard.eventDate;
  }

  return nextBillboard?.eventDate || null;
}

function shouldClearNotifications(currentBillboard, nextBillboard) {
  if (!nextBillboard?.eventId) {
    return false;
  }

  if (!currentBillboard?.eventId) {
    return true;
  }

  const nextEventDate = resolveNextEventDate(currentBillboard, nextBillboard);
  return (
    String(currentBillboard.eventId) !== String(nextBillboard.eventId) ||
    String(currentBillboard.eventDate || '') !== String(nextEventDate || '')
  );
}

function shouldKeepNotification(notification, checkedOutIds) {
  const checkedOutIdSet = checkedOutIds || new Set();
  return !checkedOutIdSet.has(String(notification.checkInId));
}

module.exports = {
  resolveNextEventDate,
  shouldClearNotifications,
  shouldKeepNotification,
};
