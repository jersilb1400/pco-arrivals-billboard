const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const {
  buildCheckInCacheKey,
  getEventLocalDate,
  isSameEventDate,
  shouldCacheCheckInPage,
  shouldClearNotifications
} = require('../utils/sessionSafety');

test('shouldClearNotifications preserves notifications for the same event/date session', () => {
  const currentBillboard = {
    eventId: 'event-1',
    eventDate: '2026-07-08'
  };

  assert.equal(shouldClearNotifications(currentBillboard, 'event-1', '2026-07-08'), false);
});

test('shouldClearNotifications clears notifications when event or date changes', () => {
  const currentBillboard = {
    eventId: 'event-1',
    eventDate: '2026-07-08'
  };

  assert.equal(shouldClearNotifications(currentBillboard, 'event-2', '2026-07-08'), true);
  assert.equal(shouldClearNotifications(currentBillboard, 'event-1', '2026-07-09'), true);
});

test('buildCheckInCacheKey scopes cached check-ins by route, date, and include shape', () => {
  const locationStatusKey = buildCheckInCacheKey('event-1', {
    scope: 'location-status',
    date: '2026-07-08',
    include: 'person,locations,checked_in_at'
  });
  const securityCodeKey = buildCheckInCacheKey('event-1', {
    scope: 'security-codes',
    include: 'person,household'
  });
  const nextDateKey = buildCheckInCacheKey('event-1', {
    scope: 'location-status',
    date: '2026-07-09',
    include: 'person,locations,checked_in_at'
  });

  assert.notEqual(locationStatusKey, securityCodeKey);
  assert.notEqual(locationStatusKey, nextDateKey);
});

test('isSameEventDate matches event-local dates instead of adjacent UTC days', () => {
  assert.equal(
    getEventLocalDate('2026-07-09T04:30:00.000Z', 'America/Chicago'),
    '2026-07-08'
  );
  assert.equal(
    isSameEventDate('2026-07-09T04:30:00.000Z', '2026-07-08', 'America/Chicago'),
    true
  );
  assert.equal(
    isSameEventDate('2026-07-09T04:30:00.000Z', '2026-07-09', 'America/Chicago'),
    false
  );
});

test('shouldCacheCheckInPage refuses partial or rate-limited result sets', () => {
  assert.equal(shouldCacheCheckInPage({ isComplete: true, rateLimited: false }), true);
  assert.equal(shouldCacheCheckInPage({ isComplete: false, rateLimited: false }), false);
  assert.equal(shouldCacheCheckInPage({ isComplete: true, rateLimited: true }), false);
});

test('/api/security-codes cache wiring scopes by event date and filters check-ins by event-local date', () => {
  const serverSource = fs.readFileSync(path.join(__dirname, '..', 'server.js'), 'utf8');
  const securityCodeDateScopedCacheCalls = serverSource.match(
    /scope: 'security-codes',\s+date: eventDate \|\| 'all-dates',\s+include: 'person,household'/g
  ) || [];

  assert.equal(securityCodeDateScopedCacheCalls.length, 3);
  assert.match(serverSource, /const checkInsForDate = eventDate[\s\S]+?isSameEventDate/);
  assert.match(serverSource, /const cachedCheckInsForDate = eventDate[\s\S]+?isSameEventDate/);
});
