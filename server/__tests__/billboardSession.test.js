const assert = require('node:assert/strict');
const test = require('node:test');

function loadShouldClearNotifications() {
  try {
    return require('../utils/billboardSession').shouldClearNotifications;
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
