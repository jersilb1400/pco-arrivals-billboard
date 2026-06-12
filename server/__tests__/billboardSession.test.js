const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { shouldClearNotifications } = require('../utils/billboardSession');

test('preserves notifications when relaunching the same event date', () => {
  const activeBillboard = {
    eventId: 'event-1',
    eventDate: '2026-05-19'
  };

  assert.equal(
    shouldClearNotifications(activeBillboard, 'event-1', '2026-05-19'),
    false
  );
});

test('clears notifications when switching event date', () => {
  const activeBillboard = {
    eventId: 'event-1',
    eventDate: '2026-05-18'
  };

  assert.equal(
    shouldClearNotifications(activeBillboard, 'event-1', '2026-05-19'),
    true
  );
});

test('clears notifications when switching events', () => {
  const activeBillboard = {
    eventId: 'event-1',
    eventDate: '2026-05-19'
  };

  assert.equal(
    shouldClearNotifications(activeBillboard, 'event-2', '2026-05-19'),
    true
  );
});

test('clears orphaned notifications when no billboard is active', () => {
  assert.equal(
    shouldClearNotifications(null, 'event-1', '2026-05-19'),
    true
  );
});


test('set-global-billboard route uses session-aware notification clearing', () => {
  const serverSource = fs.readFileSync(path.join(__dirname, '..', 'server.js'), 'utf8');
  const routeStart = serverSource.indexOf("app.post('/api/set-global-billboard'");
  const routeEnd = serverSource.indexOf("app.get('/api/debug/status'", routeStart);
  const routeSource = serverSource.slice(routeStart, routeEnd);

  assert.notEqual(routeStart, -1);
  assert.notEqual(routeEnd, -1);
  assert.match(routeSource, /shouldClearNotifications\(globalBillboardState\.activeBillboard, eventId, eventDate\)/);
  assert.doesNotMatch(routeSource, /if \(beforeCount > 0\) \{\s*activeNotifications\.length = 0;/);
});
