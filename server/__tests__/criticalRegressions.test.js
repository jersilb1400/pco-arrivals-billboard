const assert = require('node:assert/strict');
const test = require('node:test');

const {
  getCheckInCacheKey,
  isFreshCacheEntry,
} = require('../utils/checkInCache');
const {
  isActiveBillboardRequest,
  isPublicApiRequest,
} = require('../utils/publicRoutes');
const {
  resolveNextEventDate,
  shouldClearNotifications,
  shouldKeepNotification,
} = require('../utils/billboardSession');
const {
  matchesEventDate,
} = require('../utils/dateMatching');

test('public API allowlist permits only volunteer/display routes with the intended methods', () => {
  assert.equal(isPublicApiRequest('GET', '/global-billboard'), true);
  assert.equal(isPublicApiRequest('GET', '/active-notifications'), true);
  assert.equal(isPublicApiRequest('GET', '/location-status'), true);
  assert.equal(isPublicApiRequest('GET', '/billboard/check-ins'), true);
  assert.equal(isPublicApiRequest('POST', '/security-code-entry'), true);
  assert.equal(isPublicApiRequest('POST', '/auth/login'), true);

  assert.equal(isPublicApiRequest('POST', '/global-billboard'), false);
  assert.equal(isPublicApiRequest('DELETE', '/global-billboard'), false);
  assert.equal(isPublicApiRequest('PUT', '/events/123/stations'), false);
});

test('public event-scoped requests must target the active billboard session', () => {
  const activeBillboard = { eventId: 'event-1', eventDate: '2026-06-04' };

  assert.equal(
    isActiveBillboardRequest(activeBillboard, { eventId: 'event-1', eventDate: '2026-06-04' }),
    true
  );
  assert.equal(
    isActiveBillboardRequest(activeBillboard, { eventId: 'event-2', eventDate: '2026-06-04' }),
    false
  );
  assert.equal(
    isActiveBillboardRequest(activeBillboard, { eventId: 'event-1', eventDate: '2026-06-05' }),
    false
  );
});

test('same-session billboard updates preserve active pickup notifications', () => {
  assert.equal(
    resolveNextEventDate(
      { eventId: 'event-1', eventDate: '2026-06-04' },
      { eventId: 'event-1' }
    ),
    '2026-06-04'
  );
  assert.equal(
    shouldClearNotifications(
      { eventId: 'event-1', eventDate: '2026-06-04' },
      { eventId: 'event-1', eventDate: '2026-06-04' }
    ),
    false
  );
  assert.equal(
    shouldClearNotifications(
      { eventId: 'event-1', eventDate: '2026-06-04' },
      { eventId: 'event-1', eventDate: '2026-06-05' }
    ),
    true
  );
  assert.equal(
    shouldClearNotifications(
      { eventId: 'event-1', eventDate: '2026-06-04' },
      { eventId: 'event-2', eventDate: '2026-06-04' }
    ),
    true
  );
});

test('security-code matching is exact in the event timezone, not adjacent-day lenient', () => {
  assert.equal(
    matchesEventDate('2026-06-05T04:30:00.000Z', '2026-06-04', 'America/Chicago'),
    true,
    'late-evening Central check-in has next UTC date but same event-local date'
  );
  assert.equal(
    matchesEventDate('2026-06-03T23:30:00.000Z', '2026-06-04', 'America/Chicago'),
    false,
    'previous local-day check-in must not match just because it is within 24 hours'
  );
});

test('check-in cache keys include route, event, date, and include shape', () => {
  const securityCodesKey = getCheckInCacheKey({
    route: 'security-codes',
    eventId: 'event-1',
    date: '2026-06-04',
    include: 'person,household',
  });
  const nextDaySecurityCodesKey = getCheckInCacheKey({
    route: 'security-codes',
    eventId: 'event-1',
    date: '2026-06-05',
    include: 'person,household',
  });
  const locationStatusKey = getCheckInCacheKey({
    route: 'location-status',
    eventId: 'event-1',
    date: '2026-06-04',
    include: 'person,locations,checked_in_at',
  });
  const nextDayLocationStatusKey = getCheckInCacheKey({
    route: 'location-status',
    eventId: 'event-1',
    date: '2026-06-05',
    include: 'person,locations,checked_in_at',
  });

  assert.notEqual(securityCodesKey, nextDaySecurityCodesKey);
  assert.notEqual(securityCodesKey, locationStatusKey);
  assert.notEqual(locationStatusKey, nextDayLocationStatusKey);
});

test('cache freshness is scoped to the exact cache key', () => {
  const now = new Date('2026-06-04T16:00:00.000Z').getTime();
  const cacheEntry = {
    key: 'location-status:event-1:2026-06-04:person,locations,checked_in_at',
    data: { data: [] },
    lastUpdated: new Date(now - 1000),
    cacheTimeout: 30000,
  };

  assert.equal(isFreshCacheEntry(cacheEntry, cacheEntry.key, now), true);
  assert.equal(isFreshCacheEntry(cacheEntry, 'location-status:event-1:2026-06-05:person,locations,checked_in_at', now), false);
});

test('active pickup notifications are kept until checkout rather than age-expired', () => {
  const oldActiveNotification = {
    checkInId: 'check-in-1',
    notifiedAt: '2026-06-04T15:00:00.000Z',
  };

  assert.equal(shouldKeepNotification(oldActiveNotification, new Set()), true);
  assert.equal(shouldKeepNotification(oldActiveNotification, new Set(['check-in-1'])), false);
});
