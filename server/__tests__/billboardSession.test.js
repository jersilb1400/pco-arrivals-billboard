const test = require('node:test');
const assert = require('node:assert/strict');
const { shouldClearNotifications } = require('../utils/billboardSession');

test('clears notifications when there is no active session', () => {
  assert.equal(shouldClearNotifications(null, '101', '2026-04-10'), true);
});

test('preserves notifications for same event/date session', () => {
  const current = { eventId: '101', eventDate: '2026-04-10' };
  assert.equal(shouldClearNotifications(current, '101', '2026-04-10'), false);
});

test('clears notifications when event changes', () => {
  const current = { eventId: '101', eventDate: '2026-04-10' };
  assert.equal(shouldClearNotifications(current, '202', '2026-04-10'), true);
});

test('clears notifications when date changes for same event', () => {
  const current = { eventId: '101', eventDate: '2026-04-10' };
  assert.equal(shouldClearNotifications(current, '101', '2026-04-11'), true);
});

test('normalizes numeric/string IDs before comparing', () => {
  const current = { eventId: 101, eventDate: '2026-04-10' };
  assert.equal(shouldClearNotifications(current, '101', '2026-04-10'), false);
});
