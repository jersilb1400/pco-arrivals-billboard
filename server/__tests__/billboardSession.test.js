const assert = require('node:assert/strict');
const test = require('node:test');

const { shouldClearNotifications } = require('../utils/billboardSession');

test('keeps active notifications when relaunching the same event session', () => {
  const currentBillboard = {
    eventId: 'event-1',
    eventDate: '2026-05-26'
  };

  assert.equal(
    shouldClearNotifications(currentBillboard, {
      eventId: 'event-1',
      eventDate: '2026-05-26'
    }),
    false
  );
});

test('clears active notifications when switching event sessions', () => {
  const currentBillboard = {
    eventId: 'event-1',
    eventDate: '2026-05-26'
  };

  assert.equal(
    shouldClearNotifications(currentBillboard, {
      eventId: 'event-2',
      eventDate: '2026-05-26'
    }),
    true
  );
});

test('clears active notifications when switching dates for the same event', () => {
  const currentBillboard = {
    eventId: 'event-1',
    eventDate: '2026-05-26'
  };

  assert.equal(
    shouldClearNotifications(currentBillboard, {
      eventId: 'event-1',
      eventDate: '2026-05-27'
    }),
    true
  );
});
