const test = require('node:test');
const assert = require('node:assert/strict');

const { shouldClearNotifications } = require('../utils/billboardSession');

test('does not clear notifications when relaunching the same event date', () => {
  const currentBillboard = {
    eventId: 'event-123',
    eventDate: '2026-05-12'
  };
  const nextSession = {
    eventId: 'event-123',
    eventDate: '2026-05-12'
  };

  assert.equal(shouldClearNotifications(currentBillboard, nextSession), false);
});

test('clears notifications when switching event dates', () => {
  const currentBillboard = {
    eventId: 'event-123',
    eventDate: '2026-05-12'
  };
  const nextSession = {
    eventId: 'event-123',
    eventDate: '2026-05-13'
  };

  assert.equal(shouldClearNotifications(currentBillboard, nextSession), true);
});

test('clears notifications when switching events', () => {
  const currentBillboard = {
    eventId: 'event-123',
    eventDate: '2026-05-12'
  };
  const nextSession = {
    eventId: 'event-456',
    eventDate: '2026-05-12'
  };

  assert.equal(shouldClearNotifications(currentBillboard, nextSession), true);
});
