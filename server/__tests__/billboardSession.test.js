const assert = require('node:assert/strict');
const test = require('node:test');

const { shouldClearNotifications } = require('../utils/billboardSession');

test('preserves notifications when relaunching the same event and date', () => {
  const currentBillboard = {
    eventId: 'event-1',
    eventDate: '2026-05-11'
  };

  assert.equal(
    shouldClearNotifications(currentBillboard, 'event-1', '2026-05-11'),
    false
  );
});

test('clears notifications when switching to a different event', () => {
  const currentBillboard = {
    eventId: 'event-1',
    eventDate: '2026-05-11'
  };

  assert.equal(
    shouldClearNotifications(currentBillboard, 'event-2', '2026-05-11'),
    true
  );
});

test('clears notifications when switching to a different date', () => {
  const currentBillboard = {
    eventId: 'event-1',
    eventDate: '2026-05-11'
  };

  assert.equal(
    shouldClearNotifications(currentBillboard, 'event-1', '2026-05-12'),
    true
  );
});

test('clears notifications when no active billboard exists', () => {
  assert.equal(shouldClearNotifications(null, 'event-1', '2026-05-11'), true);
});
