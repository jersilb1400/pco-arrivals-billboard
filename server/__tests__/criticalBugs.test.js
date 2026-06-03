const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const serverPath = path.join(__dirname, '..', 'server.js');

test('public API allowlist is method-specific and includes volunteer/display reads', () => {
  const source = fs.readFileSync(serverPath, 'utf8');

  assert.match(source, /PUBLIC_API_ROUTES/);
  assert.match(source, /isPublicApiRequest\(req\)/);
  assert.match(source, /method:\s*'GET'[\s\S]*path:\s*'\/global-billboard'/);
  assert.match(source, /method:\s*'POST'[\s\S]*path:\s*'\/security-code-entry'/);
  assert.doesNotMatch(source, /req\.path === '\/auth-status' \|\| req\.path === '\/debug\/env' \|\| req\.path === '\/auth\/login'/);
});

test('same billboard session updates do not clear active notifications', () => {
  const { shouldClearNotifications } = require('../utils/billboardSession');

  const currentState = {
    activeBillboard: {
      eventId: 'event-1',
      eventDate: '2026-06-03'
    }
  };

  assert.equal(shouldClearNotifications(currentState, 'event-1', '2026-06-03'), false);
  assert.equal(shouldClearNotifications(currentState, 'event-1', '2026-06-04'), true);
  assert.equal(shouldClearNotifications(currentState, 'event-2', '2026-06-03'), true);
});

test('server route uses session-aware notification clearing', () => {
  const source = fs.readFileSync(serverPath, 'utf8');

  assert.match(source, /shouldClearNotifications\(globalBillboardState,\s*eventId,\s*nextEventDate\)/);
  assert.doesNotMatch(source, /if \(beforeCount > 0\) \{\s*activeNotifications\.length = 0;/);
});

test('set-global-billboard persists station icons even without color changes', () => {
  const source = fs.readFileSync(serverPath, 'utf8');

  assert.match(source, /stationIcons && typeof stationIcons === 'object' && Object\.keys\(stationIcons\)\.length > 0/);
});

test('security code matching uses exact event date in the configured timezone', () => {
  const { matchesEventDate } = require('../utils/dateMatching');

  assert.equal(
    matchesEventDate('2026-06-03T00:30:00Z', '2026-06-02', 'America/Chicago'),
    true
  );
  assert.equal(
    matchesEventDate('2026-06-02T10:00:00Z', '2026-06-03', 'America/Chicago'),
    false
  );
  assert.equal(matchesEventDate('2026-06-03', '2026-06-03', 'America/Chicago'), true);
});

test('server security code route delegates event-date matching to helper', () => {
  const source = fs.readFileSync(serverPath, 'utf8');

  assert.match(source, /matchesEventDate\(checkIn\.attributes\.created_at,\s*eventDate,\s*EVENT_TIME_ZONE\)/);
  assert.doesNotMatch(source, /daysDiff <= 1/);
});

test('check-in cache keys include route, event, date, and include shape', () => {
  const {
    createCheckInCache,
    getCachedCheckInData,
    updateCheckInCache
  } = require('../utils/checkInCache');

  const cache = createCheckInCache();
  const dateScopedKey = {
    route: 'location-status',
    eventId: 'event-1',
    date: '2026-06-03',
    include: 'person,locations,checked_in_at'
  };
  const unscopedKey = {
    route: 'security-codes',
    eventId: 'event-1',
    include: 'person,household'
  };

  updateCheckInCache(cache, dateScopedKey, { data: ['date-scoped'], included: [] });

  assert.deepEqual(getCachedCheckInData(cache, dateScopedKey).data, ['date-scoped']);
  assert.equal(getCachedCheckInData(cache, { ...dateScopedKey, date: '2026-06-04' }), null);
  assert.equal(getCachedCheckInData(cache, unscopedKey), null);
});

test('location status filters cached notifications to the requested active session', () => {
  const { filterNotificationsForSession } = require('../utils/billboardSession');

  const notifications = [
    { eventId: 'event-1', eventDate: '2026-06-03', locationId: 'loc-1' },
    { eventId: 'event-1', eventDate: '2026-06-02', locationId: 'loc-1' },
    { eventId: 'event-2', eventDate: '2026-06-03', locationId: 'loc-1' }
  ];

  assert.deepEqual(
    filterNotificationsForSession(notifications, 'event-1', '2026-06-03'),
    [{ eventId: 'event-1', eventDate: '2026-06-03', locationId: 'loc-1' }]
  );
});

test('background cleanup does not expire active notifications by age', () => {
  const source = fs.readFileSync(serverPath, 'utf8');

  assert.doesNotMatch(source, /thirtyMinutesAgo/);
  assert.doesNotMatch(source, /older than 30 minutes/);
  assert.doesNotMatch(source, /notificationTime > thirtyMinutesAgo/);
});
