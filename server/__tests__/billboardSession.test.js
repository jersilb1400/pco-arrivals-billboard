const test = require('node:test');
const assert = require('node:assert/strict');

const { shouldClearNotifications } = require('../utils/billboardSession');

test('does not clear pickup notifications when relaunching the same event date', () => {
  const currentBillboard = {
    eventId: 'event-1',
    eventDate: '2026-02-24'
  };

  assert.equal(
    shouldClearNotifications(currentBillboard, 'event-1', '2026-02-24'),
    false
  );
});

test('clears pickup notifications when the active event date changes', () => {
  const currentBillboard = {
    eventId: 'event-1',
    eventDate: '2026-02-24'
  };

  assert.equal(
    shouldClearNotifications(currentBillboard, 'event-1', '2026-02-25'),
    true
  );
});

test('clears pickup notifications when the active event changes', () => {
  const currentBillboard = {
    eventId: 'event-1',
    eventDate: '2026-02-24'
  };

  assert.equal(
    shouldClearNotifications(currentBillboard, 'event-2', '2026-02-24'),
    true
  );
});
