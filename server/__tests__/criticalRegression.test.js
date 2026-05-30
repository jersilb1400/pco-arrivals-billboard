const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

test('same-session billboard updates preserve active pickup notifications', () => {
  const { shouldClearNotifications } = require('../utils/billboardSession');

  assert.equal(
    shouldClearNotifications({ eventId: 'event-1', eventDate: '2026-05-30' }, 'event-1', '2026-05-30'),
    false
  );
  assert.equal(
    shouldClearNotifications({ eventId: 'event-1', eventDate: '2026-05-30' }, 'event-1', '2026-05-31'),
    true
  );
  assert.equal(
    shouldClearNotifications({ eventId: 'event-1', eventDate: '2026-05-30' }, 'event-2', '2026-05-30'),
    true
  );
});

test('security-code date matching rejects adjacent-day active check-ins', () => {
  const { isCheckInOnEventDate } = require('../utils/dateMatching');

  assert.equal(
    isCheckInOnEventDate('2026-05-29T12:00:00-05:00', '2026-05-30', 'America/Chicago'),
    false
  );
  assert.equal(
    isCheckInOnEventDate('2026-05-30T00:30:00-05:00', '2026-05-30', 'America/Chicago'),
    true
  );
  assert.equal(
    isCheckInOnEventDate('2026-05-31T00:10:00Z', '2026-05-30', 'America/Chicago'),
    true
  );
});

test('check-in cache keys separate route shape and selected date', () => {
  const { createCheckInCache } = require('../utils/checkInCache');
  let now = 1_000;
  const cache = createCheckInCache(30_000, () => now);

  cache.set({ eventId: 'event-1', scope: 'security-codes' }, { data: ['security-code-shape'] });
  assert.equal(cache.get({ eventId: 'event-1', scope: 'location-status', date: '2026-05-30' }), null);

  cache.set({ eventId: 'event-1', scope: 'location-status', date: '2026-05-30' }, { data: ['may-30'] });
  assert.deepEqual(cache.get({ eventId: 'event-1', scope: 'location-status', date: '2026-05-30' }), { data: ['may-30'] });
  assert.equal(cache.get({ eventId: 'event-1', scope: 'location-status', date: '2026-05-31' }), null);

  now += 30_001;
  assert.equal(cache.get({ eventId: 'event-1', scope: 'location-status', date: '2026-05-30' }), null);
});

test('critical routes are wired to regression helpers', () => {
  const serverSource = fs.readFileSync(path.join(__dirname, '..', 'server.js'), 'utf8');
  const setBillboardRoute = routeSource(serverSource, "app.post('/api/set-global-billboard'", '// Connect to MongoDB');
  const securityCodeRoute = routeSource(serverSource, "app.post('/api/security-code-entry'", "// GET /api/active-notifications");
  const locationStatusRoute = routeSource(serverSource, "app.get('/api/location-status'", '// GET /api/location-colors');

  assert.match(setBillboardRoute, /shouldClearNotifications\(/);
  assert.doesNotMatch(setBillboardRoute, /activeNotifications\.length\s*=\s*0/);
  assert.match(securityCodeRoute, /isCheckInOnEventDate\(/);
  assert.doesNotMatch(securityCodeRoute, /daysDiff\s*<=\s*1/);
  assert.match(locationStatusRoute, /checkInCacheKey\([^)]*location-status/);
  assert.match(serverSource, /checkInCacheKey\([^)]*security-codes/);
});

function routeSource(source, startMarker, endMarker) {
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker, start);
  assert.notEqual(start, -1, `${startMarker} route exists`);
  assert.notEqual(end, -1, `${endMarker} marker exists`);
  return source.slice(start, end);
}
