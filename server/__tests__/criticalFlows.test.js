const test = require('node:test');
const assert = require('node:assert/strict');

const {
  resolveNextEventDate,
  shouldClearNotifications
} = require('../utils/billboardSession');
const {
  isSameEventDate
} = require('../utils/dateMatching');
const {
  buildCheckInCacheKey,
  getCachedCheckInData,
  updateCheckInCache
} = require('../utils/checkInCache');
const {
  resolveNotificationScope,
  filterNotificationsForScope
} = require('../utils/notificationScope');
const {
  buildActiveCheckInsUrl
} = require('../utils/pcoUrls');

test('same billboard session updates preserve active notifications', () => {
  const current = {
    eventId: 'event-1',
    eventDate: '2026-06-09'
  };

  const nextDate = resolveNextEventDate(undefined, current, 'event-1');

  assert.equal(nextDate, '2026-06-09');
  assert.equal(shouldClearNotifications(current, 'event-1', nextDate), false);
});

test('different event or date clears active notifications', () => {
  const current = {
    eventId: 'event-1',
    eventDate: '2026-06-09'
  };

  assert.equal(shouldClearNotifications(current, 'event-2', '2026-06-09'), true);
  assert.equal(shouldClearNotifications(current, 'event-1', '2026-06-10'), true);
});

test('security code matching rejects adjacent-day active check-ins', () => {
  assert.equal(
    isSameEventDate('2026-06-08T12:00:00Z', '2026-06-09', 'America/Chicago'),
    false
  );
});

test('security code matching uses event timezone instead of UTC day', () => {
  assert.equal(
    isSameEventDate('2026-06-09T04:30:00Z', '2026-06-08', 'America/Chicago'),
    true
  );
});

test('check-in cache is scoped by route, date, and include shape', () => {
  let cache = null;
  const securityCodesKey = buildCheckInCacheKey({
    route: 'security-codes',
    eventId: 'event-1',
    include: 'person,household'
  });
  const locationStatusKey = buildCheckInCacheKey({
    route: 'location-status',
    eventId: 'event-1',
    date: '2026-06-09',
    include: 'person,locations,checked_in_at'
  });

  cache = updateCheckInCache(cache, securityCodesKey, { data: ['security-code-data'] }, 30000, 1000);

  assert.deepEqual(getCachedCheckInData(cache, securityCodesKey, 2000), {
    data: ['security-code-data']
  });
  assert.equal(getCachedCheckInData(cache, locationStatusKey, 2000), null);
});

test('active notifications default to the active billboard session only', () => {
  const activeBillboard = {
    eventId: 'event-1',
    eventDate: '2026-06-09'
  };
  const notifications = [
    { id: 'same', eventId: 'event-1', eventDate: '2026-06-09' },
    { id: 'other-date', eventId: 'event-1', eventDate: '2026-06-08' },
    { id: 'other-event', eventId: 'event-2', eventDate: '2026-06-09' }
  ];
  const scope = resolveNotificationScope({}, activeBillboard);

  assert.deepEqual(filterNotificationsForScope(notifications, scope), [
    { id: 'same', eventId: 'event-1', eventDate: '2026-06-09' }
  ]);
});

test('active notification requests without session context do not leak all sessions', () => {
  const notifications = [
    { id: 'other-date', eventId: 'event-1', eventDate: '2026-06-08' },
    { id: 'other-event', eventId: 'event-2', eventDate: '2026-06-09' }
  ];
  const scope = resolveNotificationScope({}, null);

  assert.deepEqual(filterNotificationsForScope(notifications, scope), []);
});

test('active-checkins URL bounds created_at to the requested day', () => {
  const url = buildActiveCheckInsUrl(
    'https://api.planningcenteronline.com/check-ins/v2',
    'event-1',
    'location-1',
    '2026-06-09'
  );

  assert.match(url, /where%5Bcreated_at%5D%5Bgte%5D=2026-06-09T00%3A00%3A00\.000Z/);
  assert.match(url, /where%5Bcreated_at%5D%5Blt%5D=2026-06-10T00%3A00%3A00\.000Z/);
});
