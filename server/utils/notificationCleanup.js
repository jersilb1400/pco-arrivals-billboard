function filterNotificationsByCheckedOutIds(notifications, checkedOutIds) {
  const checkedOutIdSet = new Set(checkedOutIds.map(id => String(id)));

  if (checkedOutIdSet.size === 0) {
    return notifications.slice();
  }

  return notifications.filter(notification => !checkedOutIdSet.has(String(notification.checkInId)));
}

module.exports = {
  filterNotificationsByCheckedOutIds,
};
