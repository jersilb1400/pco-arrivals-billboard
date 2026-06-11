const assert = require('node:assert/strict');
const test = require('node:test');

const {
  getActiveBillboardScope,
  isPublicApiRoute,
  publicRequestMatchesActiveBillboard,
  sanitizeGlobalBillboardForPublic
} = require('../utils/publicRoutes');
const {
  resolveNextEventDate,
  shouldClearNotifications
} = require('../utils/billboardSession');
const {
  isSameEventDate
} = require('../utils/dateMatching');
const {
  createCheckInCache
} = require('../utils/checkInCache');

test('public routes allow only volunteer/display methods needed without auth', () => {
  assert.equal(isPublicApiRoute('GET', '/global-billboard'), true);
  assert.equal(isPublicApiRoute('POST', '/security-code-entry'), true);
  assert.equal(isPublicApiRoute('GET', '/active-notifications'), true);
  assert.equal(isPublicApiRoute('GET', '/location-status'), true);

  assert.equal(isPublicApiRoute('POST', '/global-billboard'), false);
  assert.equal(isPublicApiRoute('POST', '/set-global-billboard'), false);
  assert.equal(isPublicApiRoute('PUT', '/events/123/stations'), false);
  assert.equal(isPublicApiRoute('POST', '/security-codes'), false);
});

test('public billboard response does not expose configured security codes', () => {
  const state = {
    activeBillboard: {
      eventId: 'event-1',
      eventName: 'Sunday',
      eventDate: '2026-06-11',
      securityCodes: ['ABCD', 'EFGH'],
      stationColors: { station: '#ffffff' }
    },
    lastUpdated: '2026-06-11T16:00:00.000Z',
    createdBy: { id: 'admin-1', name: 'Admin' }
  };

  const sanitized = sanitizeGlobalBillboardForPublic(state);

  assert.equal(sanitized.activeBillboard.eventId, 'event-1');
  assert.deepEqual(sanitized.activeBillboard.stationColors, { station: '#ffffff' });
  assert.equal(sanitized.activeBillboard.securityCodes, undefined);
  assert.equal(sanitized.createdBy, undefined);
});

test('public notification requests are scoped to the active billboard', () => {
  const state = {
    activeBillboard: {
      eventId: 'event-1',
      eventDate: '2026-06-11'
    }
  };

  assert.deepEqual(getActiveBillboardScope(state), {
    eventId: 'event-1',
    eventDate: '2026-06-11'
  });
  assert.equal(publicRequestMatchesActiveBillboard({ eventId: 'event-1', eventDate: '2026-06-11' }, state), true);
  assert.equal(publicRequestMatchesActiveBillboard({ eventId: 'event-1', eventDate: '2026-06-12' }, state), false);
  assert.equal(publicRequestMatchesActiveBillboard({ eventId: 'event-2', eventDate: '2026-06-11' }, state), false);
});

test('same event and date billboard updates keep in-flight notifications', () => {
  const currentBillboard = {
    eventId: 'event-1',
    eventDate: '2026-06-11'
  };

  assert.equal(shouldClearNotifications(currentBillboard, 'event-1', '2026-06-11'), false);
  assert.equal(shouldClearNotifications(currentBillboard, 'event-1', undefined), false);
  assert.equal(resolveNextEventDate(currentBillboard, 'event-1', undefined), '2026-06-11');
});

test('event or date changes clear stale notifications', () => {
  const currentBillboard = {
    eventId: 'event-1',
    eventDate: '2026-06-11'
  };

  assert.equal(shouldClearNotifications(currentBillboard, 'event-2', '2026-06-11'), true);
  assert.equal(shouldClearNotifications(currentBillboard, 'event-1', '2026-06-12'), true);
  assert.equal(shouldClearNotifications(null, 'event-1', '2026-06-11'), true);
});

test('security code lookup rejects adjacent UTC days outside the event local date', () => {
  assert.equal(isSameEventDate('2026-06-11T23:30:00-05:00', '2026-06-11', 'America/Chicago'), true);
  assert.equal(isSameEventDate('2026-06-10T23:30:00-05:00', '2026-06-11', 'America/Chicago'), false);
  assert.equal(isSameEventDate('2026-06-12T00:30:00-05:00', '2026-06-11', 'America/Chicago'), false);
});

test('check-in cache keys isolate endpoint, date, and include shape', () => {
  const cache = createCheckInCache(30000);
  const cachedValue = { data: [{ id: 'check-in-1' }], included: [] };

  cache.set('security-codes:event-1:all:person-household', cachedValue);

  assert.deepEqual(cache.get('security-codes:event-1:all:person-household'), cachedValue);
  assert.equal(cache.get('location-status:event-1:2026-06-11:person-locations-stations'), null);
  assert.equal(cache.get('security-codes:event-1:2026-06-12:person-household'), null);
});
