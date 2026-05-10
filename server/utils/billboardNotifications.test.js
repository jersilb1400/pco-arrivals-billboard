const assert = require('node:assert/strict');
const test = require('node:test');

const { shouldClearNotificationsForBillboardChange } = require('./billboardNotifications');

test('preserves notifications when re-saving the active event and date', () => {
  const currentBillboard = {
    eventId: 'event-1',
    eventDate: '2026-05-10'
  };

  assert.equal(
    shouldClearNotificationsForBillboardChange(currentBillboard, 'event-1', '2026-05-10'),
    false
  );
});

test('clears notifications when switching events or dates', () => {
  const currentBillboard = {
    eventId: 'event-1',
    eventDate: '2026-05-10'
  };

  assert.equal(
    shouldClearNotificationsForBillboardChange(currentBillboard, 'event-2', '2026-05-10'),
    true
  );
  assert.equal(
    shouldClearNotificationsForBillboardChange(currentBillboard, 'event-1', '2026-05-11'),
    true
  );
});
