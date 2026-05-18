function resolveNextEventDate(currentBillboard, requestedEventDate) {
  return requestedEventDate || currentBillboard?.eventDate;
}

function shouldClearNotifications(currentBillboard, nextBillboard) {
  if (!currentBillboard) {
    return true;
  }

  return String(currentBillboard.eventId) !== String(nextBillboard.eventId) ||
    String(currentBillboard.eventDate || '') !== String(nextBillboard.eventDate || '');
}

module.exports = {
  resolveNextEventDate,
  shouldClearNotifications
};
