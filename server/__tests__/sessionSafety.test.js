const assert = require('assert/strict');
const test = require('node:test');

const {
  buildCheckInCacheKey,
  isCheckInCacheHit,
} = require('../utils/checkInCache');
const {
  isCheckInOnEventDate,
} = require('../utils/dateMatching');
const {
  filterNotificationsByCheckedOutIds,
} = require('../utils/notificationCleanup');
const {
  shouldClearNotifications,
} = require('../utils/sessionSafety');

test('preserves notifications when the same event session is saved again', () => {
  const currentBillboard = {
    eventId: 'event-1',
    eventDate: '2026-07-09',
  };
  const nextBillboard = {
    eventId: 'event-1',
    eventDate: '2026-07-09',
  };

  assert.equal(shouldClearNotifications(currentBillboard, nextBillboard), false);
});

test('clears notifications when a different event session starts', () => {
  const currentBillboard = {
    eventId: 'event-1',
    eventDate: '2026-07-09',
  };
  const nextBillboard = {
    eventId: 'event-2',
    eventDate: '2026-07-09',
  };

  assert.equal(shouldClearNotifications(currentBillboard, nextBillboard), true);
});

test('clears notifications when the same recurring event moves to another date', () => {
  const currentBillboard = {
    eventId: 'event-1',
    eventDate: '2026-07-09',
  };
  const nextBillboard = {
    eventId: 'event-1',
    eventDate: '2026-07-10',
  };

  assert.equal(shouldClearNotifications(currentBillboard, nextBillboard), true);
});

test('matches check-ins only on the requested event-local date', () => {
  assert.equal(
    isCheckInOnEventDate('2026-07-09T23:30:00-05:00', '2026-07-09', 'America/Chicago'),
    true
  );
  assert.equal(
    isCheckInOnEventDate('2026-07-08T23:30:00-05:00', '2026-07-09', 'America/Chicago'),
    false
  );
  assert.equal(
    isCheckInOnEventDate('2026-07-10T00:30:00-05:00', '2026-07-09', 'America/Chicago'),
    false
  );
});

test('scopes check-in cache by consumer, event, date, and include shape', () => {
  const locationToday = buildCheckInCacheKey({
    scope: 'location-status',
    eventId: 'event-1',
    date: '2026-07-09',
    include: 'person,locations,checked_in_at',
  });
  const locationTomorrow = buildCheckInCacheKey({
    scope: 'location-status',
    eventId: 'event-1',
    date: '2026-07-10',
    include: 'person,locations,checked_in_at',
  });
  const securityCodesToday = buildCheckInCacheKey({
    scope: 'security-codes',
    eventId: 'event-1',
    date: '2026-07-09',
    include: 'person,household',
  });

  assert.notEqual(locationToday, locationTomorrow);
  assert.notEqual(locationToday, securityCodesToday);
  assert.equal(isCheckInCacheHit({ cacheKey: locationToday, lastUpdated: new Date() }, locationToday), true);
  assert.equal(isCheckInCacheHit({ cacheKey: locationToday, lastUpdated: new Date() }, locationTomorrow), false);
});

test('cleanup preserves old notifications unless PCO reports checkout', () => {
  const oldNotification = {
    checkInId: '100',
    notifiedAt: '2026-07-09T12:00:00.000Z',
  };
  const activeNotification = {
    checkInId: '101',
    notifiedAt: '2026-07-09T14:00:00.000Z',
  };

  assert.deepEqual(
    filterNotificationsByCheckedOutIds([oldNotification, activeNotification], []),
    [oldNotification, activeNotification]
  );
  assert.deepEqual(
    filterNotificationsByCheckedOutIds([oldNotification, activeNotification], [100]),
    [activeNotification]
  );
});
