const assert = require('node:assert/strict');
const test = require('node:test');

function loadShouldClearNotifications() {
  try {
    return require('../utils/billboardSession').shouldClearNotifications;
  } catch (error) {
    return undefined;
  }
}

function loadClearNotificationsForSession() {
  try {
    return require('../utils/billboardSession').clearNotificationsForSession;
  } catch (error) {
    return undefined;
  }
}

test('preserves notifications when the event and date are unchanged', () => {
  const shouldClearNotifications = loadShouldClearNotifications();
  assert.equal(typeof shouldClearNotifications, 'function');

  const activeBillboard = {
    eventId: '123',
    eventDate: '2026-07-15'
  };

  assert.equal(
    shouldClearNotifications(activeBillboard, '123', '2026-07-15'),
    false
  );
});

test('clears notifications when the active date changes', () => {
  const shouldClearNotifications = loadShouldClearNotifications();
  assert.equal(typeof shouldClearNotifications, 'function');

  const activeBillboard = {
    eventId: '123',
    eventDate: '2026-07-15'
  };

  assert.equal(
    shouldClearNotifications(activeBillboard, '123', '2026-07-16'),
    true
  );
});

test('clears notifications when the active event changes', () => {
  const shouldClearNotifications = loadShouldClearNotifications();
  assert.equal(typeof shouldClearNotifications, 'function');

  const activeBillboard = {
    eventId: '123',
    eventDate: '2026-07-15'
  };

  assert.equal(
    shouldClearNotifications(activeBillboard, '456', '2026-07-15'),
    true
  );
});

test('clears stale notifications when there is no active billboard', () => {
  const shouldClearNotifications = loadShouldClearNotifications();
  assert.equal(typeof shouldClearNotifications, 'function');

  assert.equal(
    shouldClearNotifications(null, '123', '2026-07-15'),
    true
  );
});

test('clears notifications when either session date is missing', () => {
  const shouldClearNotifications = loadShouldClearNotifications();
  assert.equal(typeof shouldClearNotifications, 'function');

  assert.equal(
    shouldClearNotifications(
      { eventId: '123', eventDate: '2026-07-15' },
      '123',
      undefined
    ),
    true
  );
  assert.equal(
    shouldClearNotifications(
      { eventId: '123', eventDate: undefined },
      '123',
      '2026-07-15'
    ),
    true
  );
});

test('preserves the queue and reports zero removals for the same session', () => {
  const clearNotificationsForSession = loadClearNotificationsForSession();
  assert.equal(typeof clearNotificationsForSession, 'function');

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
  const clearNotificationsForSession = loadClearNotificationsForSession();
  assert.equal(typeof clearNotificationsForSession, 'function');

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
