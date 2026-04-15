const test = require('node:test');
const assert = require('node:assert/strict');

const { shouldClearNotifications } = require('../utils/billboardSession');

test('clears notifications when there is no active session', () => {
  assert.equal(shouldClearNotifications(null, 'evt-1', '2026-04-15'), true);
});

test('preserves notifications for same event and date', () => {
  const current = { eventId: 'evt-1', eventDate: '2026-04-15' };
  assert.equal(shouldClearNotifications(current, 'evt-1', '2026-04-15'), false);
});

test('clears notifications when event changes', () => {
  const current = { eventId: 'evt-1', eventDate: '2026-04-15' };
  assert.equal(shouldClearNotifications(current, 'evt-2', '2026-04-15'), true);
});

test('clears notifications when date changes', () => {
  const current = { eventId: 'evt-1', eventDate: '2026-04-15' };
  assert.equal(shouldClearNotifications(current, 'evt-1', '2026-04-16'), true);
});
