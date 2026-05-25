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

  it('guards the legacy station-colors route against empty persisted assignments', () => {
    const stationColorsRoute = serverSource.match(/app\.put\('\/api\/station-colors'[\s\S]*?\n}\);/);

    assert.ok(stationColorsRoute, 'station-colors route should exist');
    assert.match(stationColorsRoute[0], /sanitizeStationColors\(stationColors\)/);
    assert.match(stationColorsRoute[0], /hasNonEmptyObject\(validated\)/);
  });
});
