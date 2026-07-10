const assert = require('node:assert/strict');
const test = require('node:test');

const { shouldClearNotifications } = require('./billboardSession');

test('does not clear notifications when relaunching the same event and date', () => {
  const currentBillboard = {
    eventId: 'event-1',
    eventDate: '2026-07-10'
  };

  assert.equal(
    shouldClearNotifications(currentBillboard, 'event-1', '2026-07-10'),
    false
  );
});

test('clears notifications when switching event or date', () => {
  const currentBillboard = {
    eventId: 'event-1',
    eventDate: '2026-07-10'
  };

  assert.equal(
    shouldClearNotifications(currentBillboard, 'event-2', '2026-07-10'),
    true
  );
  assert.equal(
    shouldClearNotifications(currentBillboard, 'event-1', '2026-07-11'),
    true
  );
});
