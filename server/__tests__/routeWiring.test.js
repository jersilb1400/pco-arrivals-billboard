const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const serverSource = fs.readFileSync(path.join(__dirname, '..', 'server.js'), 'utf8');

test('set-global-billboard only clears notifications through the session guard', () => {
  const routeStart = serverSource.indexOf("app.post('/api/set-global-billboard'");
  assert.notEqual(routeStart, -1);

  const routeEnd = serverSource.indexOf('\n// Connect to MongoDB', routeStart);
  assert.notEqual(routeEnd, -1);
  const routeSource = serverSource.slice(routeStart, routeEnd);

  assert.match(routeSource, /shouldClearNotifications\(globalBillboardState,\s*eventId,\s*eventDate\)/);
});

test('location-status cache is scoped by event date', () => {
  const routeStart = serverSource.indexOf("app.get('/api/location-status'");
  assert.notEqual(routeStart, -1);

  const routeEnd = serverSource.indexOf('\n// GET /api/location-colors', routeStart);
  assert.notEqual(routeEnd, -1);
  const routeSource = serverSource.slice(routeStart, routeEnd);

  assert.match(routeSource, /scope:\s*'location-status'/);
  assert.match(routeSource, /date:\s*date\s*\|\|\s*null/);
});
