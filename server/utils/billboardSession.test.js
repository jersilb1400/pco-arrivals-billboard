const assert = require('node:assert/strict');
const { test } = require('node:test');

const {
  filterNotificationsForBillboardSession,
  getCheckInCacheKey,
  getEffectiveNotificationScope,
  withoutCheckedOutNotifications
} = require('./billboardSession');

test('preserves same-session notifications and drops stale sessions for a billboard launch', () => {
  const notifications = [
    { checkInId: '101', eventId: 'event-a', eventDate: '2026-06-10' },
    { checkInId: '102', eventId: 'event-a', eventDate: '2026-06-09' },
    { checkInId: '103', eventId: 'event-b', eventDate: '2026-06-10' }
  ];

  assert.deepEqual(
    filterNotificationsForBillboardSession(notifications, 'event-a', '2026-06-10'),
    [{ checkInId: '101', eventId: 'event-a', eventDate: '2026-06-10' }]
  );
});

test('normalizes checked-out IDs before removing notifications', () => {
  const notifications = [
    { checkInId: '101' },
    { checkInId: 102 },
    { checkInId: '103' }
  ];

  assert.deepEqual(
    withoutCheckedOutNotifications(notifications, [101, '102']),
    [{ checkInId: '103' }]
  );
});

test('falls back to the active billboard only for unscoped notification reads', () => {
  const activeBillboard = { eventId: 'event-a', eventDate: '2026-06-10' };

  assert.deepEqual(
    getEffectiveNotificationScope({}, activeBillboard),
    { eventId: 'event-a', eventDate: '2026-06-10' }
  );
  assert.deepEqual(
    getEffectiveNotificationScope({ eventId: 'event-b', eventDate: '2026-06-11' }, activeBillboard),
    { eventId: 'event-b', eventDate: '2026-06-11' }
  );
  assert.equal(
    getEffectiveNotificationScope({ eventId: 'event-b' }, activeBillboard),
    null
  );
});

test('keys check-in cache by event and date scope', () => {
  assert.equal(getCheckInCacheKey('event-a'), 'event-a::all');
  assert.equal(getCheckInCacheKey('event-a', '2026-06-10'), 'event-a::2026-06-10');
  assert.equal(
    getCheckInCacheKey('event-a', undefined, 'location-status'),
    'location-status::event-a::all'
  );
});
