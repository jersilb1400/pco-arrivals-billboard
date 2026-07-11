const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const {
  buildCheckInCacheKey,
  filterNotificationsForSession,
  isCheckInOnEventDate,
  removeCheckedOutNotifications,
  resolveNotificationScope,
  shouldClearNotifications,
} = require('../utils/sessionSafety');

test('same-session billboard updates keep active notifications', () => {
  const current = {
    eventId: 'event-1',
    eventDate: '2026-07-11',
  };

  assert.equal(shouldClearNotifications(current, 'event-1', '2026-07-11'), false);
  assert.equal(shouldClearNotifications(current, 'event-1', '2026-07-12'), true);
  assert.equal(shouldClearNotifications(current, 'event-2', '2026-07-11'), true);
});

test('notification scope defaults to active billboard and rejects partial scopes', () => {
  const current = {
    eventId: 'event-1',
    eventDate: '2026-07-11',
  };

  assert.deepEqual(resolveNotificationScope({}, current), {
    eventId: 'event-1',
    eventDate: '2026-07-11',
  });
  assert.deepEqual(resolveNotificationScope({ eventId: 'event-2' }, current), {
    error: 'eventId and eventDate must be provided together',
  });
  assert.equal(resolveNotificationScope({}, null), null);
});

test('notifications are filtered by both event and date', () => {
  const notifications = [
    { checkInId: '1', eventId: 'event-1', eventDate: '2026-07-11' },
    { checkInId: '2', eventId: 'event-1', eventDate: '2026-07-12' },
    { checkInId: '3', eventId: 'event-2', eventDate: '2026-07-11' },
  ];

  assert.deepEqual(
    filterNotificationsForSession(notifications, 'event-1', '2026-07-11'),
    [{ checkInId: '1', eventId: 'event-1', eventDate: '2026-07-11' }]
  );
});

test('security code matching uses the event-local date, not adjacent UTC days', () => {
  assert.equal(
    isCheckInOnEventDate('2026-07-12T04:30:00.000Z', '2026-07-11', 'America/Chicago'),
    true
  );
  assert.equal(
    isCheckInOnEventDate('2026-07-12T06:30:00.000Z', '2026-07-11', 'America/Chicago'),
    false
  );
  assert.equal(
    isCheckInOnEventDate('2026-07-10T18:00:00.000Z', '2026-07-11', 'America/Chicago'),
    false
  );
});

test('check-in cache keys include route, event, date, and include scope', () => {
  assert.notEqual(
    buildCheckInCacheKey({ route: 'security-codes', eventId: 'event-1' }),
    buildCheckInCacheKey({ route: 'location-status', eventId: 'event-1', date: '2026-07-11' })
  );
  assert.notEqual(
    buildCheckInCacheKey({ route: 'location-status', eventId: 'event-1', date: '2026-07-11' }),
    buildCheckInCacheKey({ route: 'location-status', eventId: 'event-1', date: '2026-07-12' })
  );
  assert.notEqual(
    buildCheckInCacheKey({ route: 'security-codes', eventId: 'event-1', date: '2026-07-11' }),
    buildCheckInCacheKey({ route: 'security-codes', eventId: 'event-1', date: '2026-07-12' })
  );
  assert.notEqual(
    buildCheckInCacheKey({
      route: 'location-status',
      eventId: 'event-1',
      date: '2026-07-11',
      include: 'person,locations',
    }),
    buildCheckInCacheKey({
      route: 'location-status',
      eventId: 'event-1',
      date: '2026-07-11',
      include: 'person,locations,checked_in_at',
    })
  );
});

test('checked-out notification removal normalizes PCO id types', () => {
  const notifications = [
    { checkInId: 123 },
    { checkInId: '456' },
  ];

  assert.deepEqual(removeCheckedOutNotifications(notifications, ['123']), [{ checkInId: '456' }]);
  assert.deepEqual(removeCheckedOutNotifications(notifications, [456]), [{ checkInId: 123 }]);
});

test('security-codes route includes event date in its cache key', () => {
  const serverSource = fs.readFileSync(path.join(__dirname, '..', 'server.js'), 'utf8');

  assert.match(
    serverSource,
    /const securityCodesCacheKey = buildCheckInCacheKey\(\{[\s\S]*route: 'security-codes',[\s\S]*date: eventDate \|\| 'all',[\s\S]*include: 'person,household'/
  );
});
