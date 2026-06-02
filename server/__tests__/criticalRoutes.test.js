const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const test = require('node:test');

const serverSource = readFileSync(join(__dirname, '..', 'server.js'), 'utf8');
const publicApiRoutesSource = readFileSync(join(__dirname, '..', 'utils', 'publicApiRoutes.js'), 'utf8');

function routeBody(method, route) {
  const escapedRoute = route.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const startPattern = new RegExp(`app\\.${method}\\('${escapedRoute}'`);
  const startMatch = startPattern.exec(serverSource);
  assert.ok(startMatch, `Expected to find ${method.toUpperCase()} ${route}`);

  const startIndex = startMatch.index;
  const nextRouteMatch = /\napp\.(get|post|put|delete)\('/g;
  nextRouteMatch.lastIndex = startIndex + 1;
  const nextMatch = nextRouteMatch.exec(serverSource);
  return serverSource.slice(startIndex, nextMatch ? nextMatch.index : serverSource.length);
}

test('auth middleware allows public volunteer and display API routes without admin credentials', () => {
  const authMiddleware = serverSource.slice(
    serverSource.indexOf("app.use('/api'"),
    serverSource.indexOf('// Note: This server only serves API endpoints')
  );

  assert.match(authMiddleware, /isPublicApiPath\(req\.method,\s*req\.path\)/);
  assert.match(publicApiRoutesSource, /'GET \/global-billboard'/);
  assert.match(publicApiRoutesSource, /'GET \/billboard-updates'/);
  assert.match(publicApiRoutesSource, /'POST \/security-code-entry'/);
  assert.match(publicApiRoutesSource, /'GET \/active-notifications'/);
  assert.match(publicApiRoutesSource, /'GET \/location-status'/);
  assert.doesNotMatch(publicApiRoutesSource, /'POST \/global-billboard'/);
});

test('public event routes are scoped to the active billboard event', () => {
  const securityCodeRoute = routeBody('post', '/api/security-code-entry');
  const activeNotificationsRoute = routeBody('get', '/api/active-notifications');
  const locationStatusRoute = routeBody('get', '/api/location-status');
  const billboardUpdatesRoute = routeBody('get', '/api/billboard-updates');

  assert.match(serverSource, /resolvePublicEventContext/);
  assert.match(securityCodeRoute, /resolvePublicEventContext\(globalBillboardState\.activeBillboard,\s*\{\s*eventId,\s*eventDate\s*\}\)/);
  assert.match(activeNotificationsRoute, /resolvePublicEventContext\(globalBillboardState\.activeBillboard,\s*\{\s*eventId,\s*eventDate\s*\}\)/);
  assert.match(locationStatusRoute, /resolvePublicEventContext\(globalBillboardState\.activeBillboard,\s*\{\s*eventId,\s*date\s*\}\)/);
  assert.match(billboardUpdatesRoute, /resolvePublicEventContext\(globalBillboardState\.activeBillboard,\s*\{\s*eventId,\s*eventDate\s*\}\)/);
});

test('set-global-billboard only clears notifications when the event session changes', () => {
  const route = routeBody('post', '/api/set-global-billboard');

  assert.match(route, /shouldClearNotifications\(/);
  assert.match(route, /notificationsCleared:\s*clearedNotificationCount/);
  assert.doesNotMatch(route, /if\s*\(\s*beforeCount\s*>\s*0\s*\)\s*\{\s*activeNotifications\.length\s*=\s*0;/);
});

test('security-code-entry matches check-ins to the exact active event date', () => {
  const route = routeBody('post', '/api/security-code-entry');

  assert.doesNotMatch(route, /daysDiff\s*<=\s*1/);
  assert.match(route, /matchesEventDate\(checkIn\.attributes\.created_at,\s*eventDate,\s*EVENT_TIME_ZONE\)/);
});

test('location-status cache is scoped by date and include shape', () => {
  const route = routeBody('get', '/api/location-status');

  assert.doesNotMatch(route, /getCachedCheckInData\(eventId\)/);
  assert.match(serverSource, /const LOCATION_STATUS_INCLUDE = 'person,locations,checked_in_at'/);
  assert.match(route, /getCachedCheckInData\(\{\s*eventId,\s*date,\s*include:\s*LOCATION_STATUS_INCLUDE\s*\}\)/);
  assert.match(route, /updateCheckInCache\(\{\s*eventId,\s*date,\s*include:\s*LOCATION_STATUS_INCLUDE\s*\}/);
});

test('global billboard hydration includes persisted station icons', () => {
  const route = routeBody('get', '/api/global-billboard');

  assert.match(route, /buildGlobalBillboardResponse\(globalBillboardState,\s*\{/);
  assert.match(route, /stationColorDoc/);
});
