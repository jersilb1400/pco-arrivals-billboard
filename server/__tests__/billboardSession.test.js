const test = require('node:test');
const assert = require('node:assert/strict');

const { resolveNextEventDate, shouldClearNotifications } = require('../utils/billboardSession');

test('does not clear notifications when relaunching the same event session', () => {
  const currentBillboard = {
    eventId: 'event-123',
    eventDate: '2026-05-18'
  };

  assert.equal(
    shouldClearNotifications(currentBillboard, {
      eventId: 'event-123',
      eventDate: '2026-05-18'
    }),
    false
  );
});

test('clears notifications when switching event dates', () => {
  const currentBillboard = {
    eventId: 'event-123',
    eventDate: '2026-05-18'
  };

  assert.equal(
    shouldClearNotifications(currentBillboard, {
      eventId: 'event-123',
      eventDate: '2026-05-19'
    }),
    true
  );
});

test('uses current session date when request does not include a new event date', () => {
  const currentBillboard = {
    eventId: 'event-123',
    eventDate: '2026-05-18'
  };

  assert.equal(resolveNextEventDate(currentBillboard, undefined), '2026-05-18');
});
