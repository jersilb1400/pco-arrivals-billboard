const test = require('node:test');
const assert = require('node:assert/strict');

const { shouldClearNotifications } = require('../utils/billboardSession');

test('keeps active notifications when the same event session is relaunched', () => {
  const currentBillboard = {
    eventId: 123,
    eventDate: '2026-05-16'
  };

  assert.equal(
    shouldClearNotifications(currentBillboard, {
      eventId: '123',
      eventDate: '2026-05-16'
    }),
    false
  );
});

test('clears active notifications when the event session changes', () => {
  assert.equal(
    shouldClearNotifications(
      { eventId: '123', eventDate: '2026-05-16' },
      { eventId: '456', eventDate: '2026-05-16' }
    ),
    true
  );

  assert.equal(
    shouldClearNotifications(
      { eventId: '123', eventDate: '2026-05-16' },
      { eventId: '123', eventDate: '2026-05-17' }
    ),
    true
  );
});

test('clears stale notifications when no current billboard session exists', () => {
  assert.equal(
    shouldClearNotifications(null, {
      eventId: '123',
      eventDate: '2026-05-16'
    }),
    true
  );
});
