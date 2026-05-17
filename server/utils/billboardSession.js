function normalizeSessionValue(value) {
  return value == null ? '' : String(value);
}

function hasEventDatePayload(billboard) {
  return Object.prototype.hasOwnProperty.call(billboard, 'eventDate') &&
    billboard.eventDate != null &&
    billboard.eventDate !== '';
}

function shouldClearNotifications(currentBillboard, nextBillboard) {
  if (!nextBillboard?.eventId) {
    return false;
  }

  if (!currentBillboard) {
    return true;
  }

  if (normalizeSessionValue(currentBillboard.eventId) !== normalizeSessionValue(nextBillboard.eventId)) {
    return true;
  }

  if (!hasEventDatePayload(nextBillboard)) {
    return false;
  }

  return normalizeSessionValue(currentBillboard.eventDate) !== normalizeSessionValue(nextBillboard.eventDate);
}

module.exports = {
  shouldClearNotifications
};
