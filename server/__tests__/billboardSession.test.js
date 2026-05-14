const test = require('node:test');
const assert = require('node:assert/strict');

const { shouldClearNotifications } = require('../utils/billboardSession');

test('preserves notifications when reapplying the same billboard session', () => {
  const currentBillboard = {
    eventId: 'event-123',
    eventDate: '2026-05-14'
  };

  assert.equal(
    shouldClearNotifications(currentBillboard, {
      eventId: 'event-123',
      eventDate: '2026-05-14'
    }),
    false
  );
});

test('clears notifications when switching to a different event', () => {
  const currentBillboard = {
    eventId: 'event-123',
    eventDate: '2026-05-14'
  };

  assert.equal(
    shouldClearNotifications(currentBillboard, {
      eventId: 'event-456',
      eventDate: '2026-05-14'
    }),
    true
  );
});

test('clears notifications when switching to a different event date', () => {
  const currentBillboard = {
    eventId: 'event-123',
    eventDate: '2026-05-14'
  };

  assert.equal(
    shouldClearNotifications(currentBillboard, {
      eventId: 'event-123',
      eventDate: '2026-05-15'
    }),
    true
  );
});
