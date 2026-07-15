const assert = require('node:assert/strict');
const test = require('node:test');
const {
  clearNotificationsForSession,
  shouldClearNotifications
} = require('../utils/billboardSession');

test('preserves notifications when the event and date are unchanged', () => {
  const activeBillboard = {
    eventId: '123',
    eventDate: '2026-07-15'
  };

  assert.equal(
    shouldClearNotifications(activeBillboard, '123', '2026-07-15'),
    false
  );
});

test('clears notifications when the session identity changes or is incomplete', () => {
  const activeBillboard = {
    eventId: '123',
    eventDate: '2026-07-15'
  };
  const changedSessions = [
    [activeBillboard, '123', '2026-07-16'],
    [activeBillboard, '456', '2026-07-15'],
    [null, '123', '2026-07-15'],
    [activeBillboard, '123', undefined],
    [{ eventId: '123' }, '123', '2026-07-15'],
    [{ eventId: '123' }, '123', undefined]
  ];

  for (const session of changedSessions) {
    assert.equal(shouldClearNotifications(...session), true);
  }
});

test('preserves the queue and reports zero removals for the same session', () => {
  const notifications = [{ id: 'one' }, { id: 'two' }];
  const activeBillboard = {
    eventId: '123',
    eventDate: '2026-07-15'
  };

  const removed = clearNotificationsForSession(
    notifications,
    activeBillboard,
    '123',
    '2026-07-15'
  );

  assert.equal(removed, 0);
  assert.deepEqual(notifications, [{ id: 'one' }, { id: 'two' }]);
});

test('clears the queue and reports removals when the session changes', () => {
  const notifications = [{ id: 'one' }, { id: 'two' }];
  const activeBillboard = {
    eventId: '123',
    eventDate: '2026-07-15'
  };

  const removed = clearNotificationsForSession(
    notifications,
    activeBillboard,
    '123',
    '2026-07-16'
  );

  assert.equal(removed, 2);
  assert.deepEqual(notifications, []);
});
