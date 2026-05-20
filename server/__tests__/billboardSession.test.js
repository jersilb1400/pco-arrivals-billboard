const assert = require('node:assert/strict');
const test = require('node:test');

const {
  resolveNextEventDate,
  shouldClearNotifications
} = require('../utils/billboardSession');

test('same event and date keeps active pickup notifications', () => {
  const currentBillboard = { eventId: 'event-1', eventDate: '2026-05-20' };

  assert.equal(shouldClearNotifications(currentBillboard, 'event-1', '2026-05-20'), false);
});

test('different event clears active pickup notifications', () => {
  const currentBillboard = { eventId: 'event-1', eventDate: '2026-05-20' };

  assert.equal(shouldClearNotifications(currentBillboard, 'event-2', '2026-05-20'), true);
});

test('different date clears active pickup notifications', () => {
  const currentBillboard = { eventId: 'event-1', eventDate: '2026-05-20' };

  assert.equal(shouldClearNotifications(currentBillboard, 'event-1', '2026-05-21'), true);
});

test('omitted date on same active billboard preserves the current session date', () => {
  const currentBillboard = { eventId: 'event-1', eventDate: '2026-05-20' };
  const nextEventDate = resolveNextEventDate(currentBillboard);

  assert.equal(nextEventDate, '2026-05-20');
  assert.equal(shouldClearNotifications(currentBillboard, 'event-1', nextEventDate), false);
});
