const assert = require('assert');
const { shouldClearNotificationsForSessionChange } = require('../utils/notificationSession');

function run() {
  assert.strictEqual(
    shouldClearNotificationsForSessionChange(null, 'event-1', '2026-03-25'),
    true,
    'Should clear when there is no previous active billboard'
  );

  assert.strictEqual(
    shouldClearNotificationsForSessionChange(
      { eventId: 'event-1', eventDate: '2026-03-25' },
      'event-1',
      '2026-03-25'
    ),
    false,
    'Should preserve notifications for identical event/date session'
  );

  assert.strictEqual(
    shouldClearNotificationsForSessionChange(
      { eventId: 123, eventDate: '2026-03-25' },
      '123',
      '2026-03-25'
    ),
    false,
    'Should preserve notifications when event IDs match after string coercion'
  );

  assert.strictEqual(
    shouldClearNotificationsForSessionChange(
      { eventId: 'event-1', eventDate: '2026-03-25' },
      'event-2',
      '2026-03-25'
    ),
    true,
    'Should clear notifications when event changes'
  );

  assert.strictEqual(
    shouldClearNotificationsForSessionChange(
      { eventId: 'event-1', eventDate: '2026-03-25' },
      'event-1',
      '2026-03-26'
    ),
    true,
    'Should clear notifications when event date changes'
  );

  assert.strictEqual(
    shouldClearNotificationsForSessionChange(
      { eventId: 'event-1', eventDate: undefined },
      'event-1',
      undefined
    ),
    false,
    'Should preserve notifications when both dates are missing'
  );

  console.log('notificationSession tests passed');
}

run();
