const assert = require('node:assert/strict');
const test = require('node:test');

const {
  buildCheckInCacheKey,
  getEventLocalDate,
  isSameEventDate,
  shouldClearNotifications
} = require('../utils/sessionSafety');

test('shouldClearNotifications preserves notifications for the same event/date session', () => {
  const currentBillboard = {
    eventId: 'event-1',
    eventDate: '2026-07-06'
  };

  assert.equal(shouldClearNotifications(currentBillboard, 'event-1', '2026-07-06'), false);
});

test('shouldClearNotifications clears notifications when event or date changes', () => {
  const currentBillboard = {
    eventId: 'event-1',
    eventDate: '2026-07-06'
  };

  assert.equal(shouldClearNotifications(currentBillboard, 'event-2', '2026-07-06'), true);
  assert.equal(shouldClearNotifications(currentBillboard, 'event-1', '2026-07-07'), true);
});

test('buildCheckInCacheKey scopes cached check-ins by route, date, and include shape', () => {
  const locationStatusKey = buildCheckInCacheKey('event-1', {
    scope: 'location-status',
    date: '2026-07-06',
    include: 'person,locations,checked_in_at'
  });
  const securityCodeKey = buildCheckInCacheKey('event-1', {
    scope: 'security-codes',
    include: 'person,household'
  });
  const nextDateKey = buildCheckInCacheKey('event-1', {
    scope: 'location-status',
    date: '2026-07-07',
    include: 'person,locations,checked_in_at'
  });

  assert.notEqual(locationStatusKey, securityCodeKey);
  assert.notEqual(locationStatusKey, nextDateKey);
});

test('isSameEventDate matches the event-local date instead of adjacent UTC days', () => {
  assert.equal(
    getEventLocalDate('2026-07-07T04:30:00.000Z', 'America/Chicago'),
    '2026-07-06'
  );
  assert.equal(
    isSameEventDate('2026-07-07T04:30:00.000Z', '2026-07-06', 'America/Chicago'),
    true
  );
  assert.equal(
    isSameEventDate('2026-07-07T04:30:00.000Z', '2026-07-07', 'America/Chicago'),
    false
  );
});
