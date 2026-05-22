const test = require('node:test');
const assert = require('node:assert/strict');

const { resolveNextEventDate, shouldClearNotifications } = require('../utils/billboardSession');

test('does not clear pickup notifications when re-saving the same event and date', () => {
  const currentBillboard = {
    eventId: 'event-1',
    eventDate: '2026-05-22'
  };

  assert.equal(
    shouldClearNotifications(currentBillboard, 'event-1', '2026-05-22'),
    false
  );
});

test('clears pickup notifications when switching event or date', () => {
  const currentBillboard = {
    eventId: 'event-1',
    eventDate: '2026-05-22'
  };

  assert.equal(shouldClearNotifications(currentBillboard, 'event-2', '2026-05-22'), true);
  assert.equal(shouldClearNotifications(currentBillboard, 'event-1', '2026-05-23'), true);
});

test('only reuses a missing event date for the same event', () => {
  const currentBillboard = {
    eventId: 'event-1',
    eventDate: '2026-05-22'
  };

  assert.equal(resolveNextEventDate(currentBillboard, 'event-1'), '2026-05-22');
  assert.equal(resolveNextEventDate(currentBillboard, 'event-2'), null);
});
