const assert = require('node:assert/strict');
const test = require('node:test');

const { shouldClearNotifications } = require('../utils/billboardSession');

test('preserves notifications when relaunching the same event date', () => {
  const currentBillboard = {
    eventId: 'event-1',
    eventDate: '2026-05-09'
  };

  const shouldClear = shouldClearNotifications(currentBillboard, {
    eventId: 'event-1',
    eventDate: '2026-05-09'
  });

  assert.equal(shouldClear, false);
});

test('clears notifications when changing event or date', () => {
  assert.equal(
    shouldClearNotifications(
      { eventId: 'event-1', eventDate: '2026-05-09' },
      { eventId: 'event-2', eventDate: '2026-05-09' }
    ),
    true
  );

  assert.equal(
    shouldClearNotifications(
      { eventId: 'event-1', eventDate: '2026-05-09' },
      { eventId: 'event-1', eventDate: '2026-05-10' }
    ),
    true
  );
});
