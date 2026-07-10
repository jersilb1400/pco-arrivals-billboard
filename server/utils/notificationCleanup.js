function removeCheckedOutNotifications(notifications, checkedOutIds) {
  if (!Array.isArray(checkedOutIds) || checkedOutIds.length === 0) {
    return notifications;
  }

  const checkedOutIdSet = new Set(checkedOutIds);
  return notifications.filter(notification => !checkedOutIdSet.has(notification.checkInId));
}

module.exports = {
  removeCheckedOutNotifications
};
