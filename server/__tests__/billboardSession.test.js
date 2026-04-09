const test = require('node:test');
const assert = require('node:assert/strict');
const { shouldClearNotifications } = require('../utils/billboardSession');

test('clears notifications when there is no active billboard yet', () => {
  assert.equal(shouldClearNotifications(null, '123', '2026-04-09'), true);
});

test('preserves notifications for same event and date session', () => {
  const current = { eventId: '123', eventDate: '2026-04-09' };
  assert.equal(shouldClearNotifications(current, '123', '2026-04-09'), false);
});

test('clears notifications when event changes', () => {
  const current = { eventId: '123', eventDate: '2026-04-09' };
  assert.equal(shouldClearNotifications(current, '999', '2026-04-09'), true);
});

test('clears notifications when date changes for same event', () => {
  const current = { eventId: '123', eventDate: '2026-04-09' };
  assert.equal(shouldClearNotifications(current, '123', '2026-04-10'), true);
});

test('treats missing incoming date as session change when current has date', () => {
  const current = { eventId: '123', eventDate: '2026-04-09' };
  assert.equal(shouldClearNotifications(current, '123', undefined), true);
});

