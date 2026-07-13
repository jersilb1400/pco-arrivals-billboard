const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const {
  buildCheckInCacheKey,
  filterNotificationsForScope,
  isCheckInOnEventDate,
  pruneCheckedOutNotifications,
  shouldClearNotifications
} = require('../utils/sessionSafety');

test('shouldClearNotifications preserves pickup queue for same event and date', () => {
  const currentBillboard = {
    eventId: 'event-1',
    eventDate: '2026-07-13'
  };

  assert.equal(
    shouldClearNotifications(currentBillboard, {
      eventId: 'event-1',
      eventDate: '2026-07-13'
    }),
    false
  );
});

test('shouldClearNotifications clears pickup queue when event or date changes', () => {
  const currentBillboard = {
    eventId: 'event-1',
    eventDate: '2026-07-13'
  };

  assert.equal(
    shouldClearNotifications(currentBillboard, {
      eventId: 'event-2',
      eventDate: '2026-07-13'
    }),
    true
  );
  assert.equal(
    shouldClearNotifications(currentBillboard, {
      eventId: 'event-1',
      eventDate: '2026-07-14'
    }),
    true
  );
});

test('buildCheckInCacheKey separates route date and include shape', () => {
  const base = {
    eventId: 'event-1',
    date: '2026-07-13',
    include: 'person,locations'
  };

  assert.notEqual(
    buildCheckInCacheKey({ ...base, route: 'security-codes' }),
    buildCheckInCacheKey({ ...base, route: 'location-status' })
  );
  assert.notEqual(
    buildCheckInCacheKey({ ...base, route: 'location-status' }),
    buildCheckInCacheKey({ ...base, route: 'location-status', date: '2026-07-14' })
  );
  assert.notEqual(
    buildCheckInCacheKey({ ...base, route: 'location-status' }),
    buildCheckInCacheKey({ ...base, route: 'location-status', include: 'person,household' })
  );
});

test('isCheckInOnEventDate rejects adjacent-day reused security codes', () => {
  assert.equal(
    isCheckInOnEventDate('2026-07-12T18:00:00-05:00', '2026-07-13', 'America/Chicago'),
    false
  );
  assert.equal(
    isCheckInOnEventDate('2026-07-13T08:30:00-05:00', '2026-07-13', 'America/Chicago'),
    true
  );
});

test('filterNotificationsForScope returns only the active event/date notifications', () => {
  const notifications = [
    { checkInId: '1', eventId: 'event-1', eventDate: '2026-07-13' },
    { checkInId: '2', eventId: 'event-1', eventDate: '2026-07-14' },
    { checkInId: '3', eventId: 'event-2', eventDate: '2026-07-13' }
  ];

  assert.deepEqual(
    filterNotificationsForScope(notifications, {
      eventId: 'event-1',
      eventDate: '2026-07-13'
    }),
    [{ checkInId: '1', eventId: 'event-1', eventDate: '2026-07-13' }]
  );
});

test('pruneCheckedOutNotifications removes only normalized checked-out IDs', () => {
  const notifications = [
    { checkInId: 123, childName: 'One' },
    { checkInId: '456', childName: 'Two' },
    { checkInId: '789', childName: 'Three' }
  ];

  assert.deepEqual(
    pruneCheckedOutNotifications(notifications, ['123', 789]),
    [{ checkInId: '456', childName: 'Two' }]
  );
});

test('server routes are wired to session safety helpers', () => {
  const serverSource = fs.readFileSync(path.join(__dirname, '..', 'server.js'), 'utf8');

  assert.match(serverSource, /shouldClearNotifications\(/);
  assert.doesNotMatch(serverSource, /activeNotifications\.length\s*=\s*0/);
  assert.doesNotMatch(serverSource, /daysDiff\s*<=\s*1/);
  assert.doesNotMatch(serverSource, /getCachedCheckInData\(eventId\)/);
  assert.doesNotMatch(serverSource, /updateCheckInCache\(eventId,/);
  assert.doesNotMatch(serverSource, /older than 30 minutes/);
});
