const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const serverSource = fs.readFileSync(path.join(__dirname, '..', 'server.js'), 'utf8');

test('auth middleware uses method-specific public-route policy instead of path-only skips', () => {
  assert.match(serverSource, /isPublicApiRequest\(req\.method,\s*req\.path\)/);
  assert.doesNotMatch(serverSource, /req\.path === '\/auth-status'/);
});

test('public event routes are scoped to the active billboard before hitting PCO', () => {
  assert.match(serverSource, /ensureActivePublicBillboardRequest/);
  assert.match(serverSource, /app\.post\('\/api\/security-code-entry'[\s\S]*ensureActivePublicBillboardRequest/);
  assert.match(serverSource, /app\.get\('\/api\/location-status'[\s\S]*ensureActivePublicBillboardRequest/);
  assert.match(serverSource, /app\.get\('\/api\/billboard\/check-ins'[\s\S]*ensureActivePublicBillboardRequest/);
});

test('set-global-billboard clears notifications only on session changes', () => {
  assert.match(serverSource, /shouldClearNotifications/);
  assert.doesNotMatch(serverSource, /if \(beforeCount > 0\) \{\s*activeNotifications\.length = 0;/);
});

test('security-code-entry does not use adjacent-day date matching', () => {
  assert.match(serverSource, /matchesEventDate/);
  assert.doesNotMatch(serverSource, /daysDiff <= 1/);
});

test('location-status uses the route/date scoped cache key it computes', () => {
  assert.match(serverSource, /getCheckInCacheKey\(\{[\s\S]*route: 'location-status'/);
  assert.match(serverSource, /getCachedCheckInData\(cacheKey\)/);
  assert.match(serverSource, /updateCheckInCache\(cacheKey,/);
});

test('security-codes cache key includes eventDate when available', () => {
  assert.match(serverSource, /getCheckInCacheKey\(\{[\s\S]*route: 'security-codes'[\s\S]*date: eventDate/);
});

test('same-session set-global-billboard updates retain the resolved event date', () => {
  assert.match(serverSource, /const nextEventDate = resolveNextEventDate/);
  assert.match(serverSource, /updateGlobalBillboardState\(eventId, eventName, securityCodes \|\| \[\], nextEventDate/);
});

test('set-global-billboard persists station icon-only updates', () => {
  assert.match(serverSource, /hasStationIcons/);
  assert.match(serverSource, /\|\|\s*hasStationIcons/);
});

test('cleanup interval does not remove notifications only because they are older than 30 minutes', () => {
  assert.doesNotMatch(serverSource, /thirtyMinutesAgo/);
  assert.doesNotMatch(serverSource, /older than 30 minutes/);
});
