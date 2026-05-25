const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { describe, it } = require('node:test');

const serverSource = fs.readFileSync(path.join(__dirname, '..', 'server.js'), 'utf8');

describe('critical route wiring', () => {
  it('uses strict event-date matching for security code entry', () => {
    assert.match(serverSource, /doesCheckInMatchEventDate\(/);
    assert.doesNotMatch(serverSource, /daysDiff\s*<=\s*1/);
  });

  it('guards notification clearing by active event session identity', () => {
    assert.match(serverSource, /shouldClearNotifications\(/);
  });

  it('uses the location-status cache key instead of event-only cache lookup', () => {
    assert.match(serverSource, /buildCheckInCacheKey\('location-status',\s*eventId,\s*date/);
    assert.doesNotMatch(serverSource, /const cachedData = getCachedCheckInData\(eventId\)/);
  });
});
