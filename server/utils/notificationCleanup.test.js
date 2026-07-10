const assert = require('node:assert/strict');
const test = require('node:test');

const { removeCheckedOutNotifications } = require('./notificationCleanup');

test('keeps old notifications that have not checked out', () => {
  const oldNotification = {
    checkInId: 'check-in-1',
    notifiedAt: '2026-07-10T15:00:00.000Z'
  };

  const result = removeCheckedOutNotifications([oldNotification], []);

  assert.deepEqual(result, [oldNotification]);
});

test('removes only notifications for checked-out children', () => {
  const waitingNotification = { checkInId: 'check-in-1' };
  const checkedOutNotification = { checkInId: 'check-in-2' };

  const result = removeCheckedOutNotifications(
    [waitingNotification, checkedOutNotification],
    ['check-in-2']
  );

  assert.deepEqual(result, [waitingNotification]);
});
