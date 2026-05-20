const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const serverSource = fs.readFileSync(path.join(__dirname, '..', 'server.js'), 'utf8');

function routeSource(startMarker, endMarker) {
  const start = serverSource.indexOf(startMarker);
  const end = serverSource.indexOf(endMarker, start);

  assert.notEqual(start, -1, `Missing route marker: ${startMarker}`);
  assert.notEqual(end, -1, `Missing route end marker: ${endMarker}`);

  return serverSource.slice(start, end);
}

test('set-global-billboard route guards notification clearing by session identity', () => {
  const route = routeSource("app.post('/api/set-global-billboard'", '// Connect to MongoDB');

  assert.match(route, /resolveNextEventDate/);
  assert.match(route, /shouldClearNotifications/);
  assert.match(route, /const notificationsCleared = shouldClearNotifications/);
});

test('security-code-entry route uses strict event date matching', () => {
  const route = routeSource("app.post('/api/security-code-entry'", '// GET /api/active-notifications');

  assert.match(route, /isSameEventDate/);
  assert.doesNotMatch(route, /daysDiff\s*<=\s*1/);
});
