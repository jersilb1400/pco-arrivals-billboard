const assert = require('node:assert/strict');
const test = require('node:test');

const { shouldClearNotifications } = require('../utils/billboardSession');

test('preserves notifications for the same event and date', () => {
  assert.equal(
    shouldClearNotifications(
      { eventId: 'event-1', eventDate: '2026-06-02' },
      { eventId: 'event-1', eventDate: '2026-06-02' }
    ),
    false
  );
});

test('clears notifications when event or date changes', () => {
  assert.equal(
    shouldClearNotifications(
      { eventId: 'event-1', eventDate: '2026-06-02' },
      { eventId: 'event-2', eventDate: '2026-06-02' }
    ),
    true
  );
  assert.equal(
    shouldClearNotifications(
      { eventId: 'event-1', eventDate: '2026-06-02' },
      { eventId: 'event-1', eventDate: '2026-06-03' }
    ),
    true
  );
});
