function shouldClearNotifications(currentBillboard, nextBillboard) {
  if (!nextBillboard?.eventId) {
    return false;
  }

  if (!currentBillboard?.eventId) {
    return true;
  }

  return (
    currentBillboard.eventId !== nextBillboard.eventId ||
    currentBillboard.eventDate !== nextBillboard.eventDate
  );
}

module.exports = {
  shouldClearNotifications
};
