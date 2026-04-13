const test = require('node:test');
const assert = require('node:assert/strict');
const { shouldClearNotifications } = require('../utils/billboardSession');

test('clears when there is no current billboard session', () => {
  assert.equal(shouldClearNotifications(null, '100', '2026-04-11'), true);
});

test('preserves notifications for same event and date', () => {
  const current = { eventId: '100', eventDate: '2026-04-11' };
  assert.equal(shouldClearNotifications(current, '100', '2026-04-11'), false);
});

test('clears notifications when event changes', () => {
  const current = { eventId: '100', eventDate: '2026-04-11' };
  assert.equal(shouldClearNotifications(current, '101', '2026-04-11'), true);
});

test('clears notifications when date changes', () => {
  const current = { eventId: '100', eventDate: '2026-04-11' };
  assert.equal(shouldClearNotifications(current, '100', '2026-04-12'), true);
});
