const assert = require('node:assert/strict');
const test = require('node:test');

const { shouldClearNotifications } = require('../utils/billboardSession');

test('does not clear notifications when relaunching the same event and date', () => {
  const currentBillboard = {
    eventId: 'event-1',
    eventDate: '2026-06-01'
  };

  assert.equal(
    shouldClearNotifications(currentBillboard, 'event-1', '2026-06-01'),
    false
  );
});

test('clears notifications when switching event or event date', () => {
  const currentBillboard = {
    eventId: 'event-1',
    eventDate: '2026-06-01'
  };

  assert.equal(
    shouldClearNotifications(currentBillboard, 'event-2', '2026-06-01'),
    true
  );
  assert.equal(
    shouldClearNotifications(currentBillboard, 'event-1', '2026-06-02'),
    true
  );
});

test('clears notifications when no current billboard context exists', () => {
  assert.equal(shouldClearNotifications(null, 'event-1', '2026-06-01'), true);
});
