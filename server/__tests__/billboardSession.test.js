const test = require('node:test');
const assert = require('node:assert/strict');

const { shouldClearNotifications } = require('../utils/billboardSession');

test('does not clear when there is no active billboard', () => {
  assert.equal(shouldClearNotifications(null, '123', '2026-04-14'), false);
});

test('does not clear for same event and date', () => {
  const activeBillboard = { eventId: '123', eventDate: '2026-04-14' };
  assert.equal(shouldClearNotifications(activeBillboard, '123', '2026-04-14'), false);
});

test('clears when event id changes', () => {
  const activeBillboard = { eventId: '123', eventDate: '2026-04-14' };
  assert.equal(shouldClearNotifications(activeBillboard, '999', '2026-04-14'), true);
});

test('clears when event date changes', () => {
  const activeBillboard = { eventId: '123', eventDate: '2026-04-14' };
  assert.equal(shouldClearNotifications(activeBillboard, '123', '2026-04-15'), true);
});
