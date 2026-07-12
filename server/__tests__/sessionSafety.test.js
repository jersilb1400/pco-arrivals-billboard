const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const {
  buildCheckInCacheKey,
  filterNotificationsForScope,
  getEventDateInTimeZone,
  isCheckInOnEventDate,
  pruneCheckedOutNotifications,
  shouldClearNotifications,
} = require('../utils/sessionSafety');

test('same event and date billboard updates preserve active notifications', () => {
  const currentState = {
    activeBillboard: {
      eventId: 'event-1',
      eventDate: '2026-07-12',
    },
  };

  assert.equal(
    shouldClearNotifications(currentState, {
      eventId: 'event-1',
      eventDate: '2026-07-12',
    }),
    false
  );
});

test('event or date transitions clear active notifications', () => {
  const currentState = {
    activeBillboard: {
      eventId: 'event-1',
      eventDate: '2026-07-12',
    },
  };

  assert.equal(
    shouldClearNotifications(currentState, {
      eventId: 'event-2',
      eventDate: '2026-07-12',
    }),
    true
  );
  assert.equal(
    shouldClearNotifications(currentState, {
      eventId: 'event-1',
      eventDate: '2026-07-13',
    }),
    true
  );
});

test('security-code date matching rejects adjacent UTC dates outside the event day', () => {
  assert.equal(
    isCheckInOnEventDate('2026-07-11T23:30:00-05:00', '2026-07-12', 'America/Chicago'),
    false
  );
  assert.equal(
    isCheckInOnEventDate('2026-07-12T08:00:00-05:00', '2026-07-12', 'America/Chicago'),
    true
  );
});

test('event-local date formatting handles UTC rollover without adjacent-day matching', () => {
  assert.equal(
    getEventDateInTimeZone('2026-07-12T00:30:00Z', 'America/Chicago'),
    '2026-07-11'
  );
});

test('check-in cache keys include route, event, date, and include shape', () => {
  const securityCodesKey = buildCheckInCacheKey({
    route: 'security-codes',
    eventId: 'event-1',
    date: '2026-07-12',
    include: 'person,household',
  });
  const locationStatusKey = buildCheckInCacheKey({
    route: 'location-status',
    eventId: 'event-1',
    date: '2026-07-12',
    include: 'person,locations,checked_in_at',
  });
  const otherDateKey = buildCheckInCacheKey({
    route: 'location-status',
    eventId: 'event-1',
    date: '2026-07-13',
    include: 'person,locations,checked_in_at',
  });

  assert.notEqual(securityCodesKey, locationStatusKey);
  assert.notEqual(locationStatusKey, otherDateKey);
});

test('notification filtering fails closed to the active billboard scope', () => {
  const notifications = [
    { id: 'current', eventId: 'event-1', eventDate: '2026-07-12' },
    { id: 'other-event', eventId: 'event-2', eventDate: '2026-07-12' },
    { id: 'other-date', eventId: 'event-1', eventDate: '2026-07-13' },
  ];
  const currentState = {
    activeBillboard: {
      eventId: 'event-1',
      eventDate: '2026-07-12',
    },
  };

  assert.deepEqual(
    filterNotificationsForScope(notifications, {}, currentState).map(({ id }) => id),
    ['current']
  );
});

test('checked-out cleanup normalizes IDs and does not remove notifications by age', () => {
  const notifications = [
    {
      id: 'old-active',
      checkInId: '101',
      notifiedAt: '2026-07-12T10:00:00Z',
    },
    {
      id: 'checked-out',
      checkInId: '202',
      notifiedAt: '2026-07-12T11:00:00Z',
    },
  ];

  assert.deepEqual(
    pruneCheckedOutNotifications(notifications, [202]).map(({ id }) => id),
    ['old-active']
  );
});

test('server routes are wired to session safety helpers instead of unsafe patterns', () => {
  const serverSource = fs.readFileSync(path.join(__dirname, '..', 'server.js'), 'utf8');

  assert.match(serverSource, /shouldClearNotifications/);
  assert.match(serverSource, /isCheckInOnEventDate/);
  assert.match(serverSource, /buildCheckInCacheKey/);
  assert.match(serverSource, /filterNotificationsForScope/);
  assert.match(serverSource, /pruneCheckedOutNotifications/);
  assert.doesNotMatch(serverSource, /activeNotifications\.length\s*=\s*0/);
  assert.doesNotMatch(serverSource, /daysDiff\s*<=\s*1/);
  assert.doesNotMatch(serverSource, /getCachedCheckInData\(eventId\)/);
  assert.doesNotMatch(serverSource, /checkedOutIds\.includes\(n\.checkInId\)/);
});
