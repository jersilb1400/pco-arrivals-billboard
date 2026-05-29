const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const serverSource = fs.readFileSync(path.join(__dirname, '..', 'server.js'), 'utf8');

test('set-global-billboard uses session-aware notification clearing', () => {
  assert.match(serverSource, /shouldClearNotifications/);
  assert.doesNotMatch(
    serverSource,
    /activeNotifications\.length = 0;\n\s+console\.log\(`Server: Cleared \$\{beforeCount\} notifications from previous events`\);/
  );
});

test('security-code-entry uses strict event-date matching', () => {
  assert.match(serverSource, /isCheckInOnEventDate/);
  assert.doesNotMatch(serverSource, /daysDiff\s*<=\s*1/);
});

test('location-status cache is scoped by date and response shape', () => {
  assert.match(
    serverSource,
    /buildCheckInCacheKey\(eventId,\s*\{[\s\S]*endpoint:\s*'location-status'[\s\S]*date:/
  );
  assert.doesNotMatch(serverSource, /const cachedData = getCachedCheckInData\(eventId\);/);
});
