const assert = require('node:assert/strict');
const test = require('node:test');
const { normalizeEventDate, isSameBillboardSession, shouldClearNotifications } = require('./billboardSession');

test('normalizeEventDate normalizes ISO timestamps to YYYY-MM-DD', () => {
  assert.equal(normalizeEventDate('2026-04-06T19:30:00.000Z'), '2026-04-06');
});

test('isSameBillboardSession matches same event/date across formats', () => {
  const previousBillboard = {
    eventId: 123,
    eventDate: '2026-04-06T00:00:00.000Z'
  };

  assert.equal(isSameBillboardSession(previousBillboard, '123', '2026-04-06'), true);
});

test('shouldClearNotifications returns true when event date changes', () => {
  const previousBillboard = {
    eventId: '123',
    eventDate: '2026-04-06'
  };

  assert.equal(shouldClearNotifications(previousBillboard, '123', '2026-04-07'), true);
});

test('shouldClearNotifications returns true when event id changes', () => {
  const previousBillboard = {
    eventId: '123',
    eventDate: '2026-04-06'
  };

  assert.equal(shouldClearNotifications(previousBillboard, '456', '2026-04-06'), true);
});

