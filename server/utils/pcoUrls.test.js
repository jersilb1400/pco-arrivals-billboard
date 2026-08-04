const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { getEventLocalDayRange, buildBillboardCheckInsUrl } = require('./pcoUrls');

describe('getEventLocalDayRange', () => {
  it('bounds a Chicago summer day so evening local check-ins are included', () => {
    const range = getEventLocalDayRange('2026-08-04', 'America/Chicago');
    assert.ok(range);
    // CDT = UTC-5 → local midnight is 05:00Z, next midnight 05:00Z next day
    assert.equal(range.start.toISOString(), '2026-08-04T05:00:00.000Z');
    assert.equal(range.end.toISOString(), '2026-08-05T05:00:00.000Z');

    // 8pm CDT on Aug 4 is 01:00Z Aug 5 — inside local day, outside naive UTC day
    const eveningCheckIn = new Date('2026-08-05T01:00:00.000Z');
    assert.ok(eveningCheckIn >= range.start && eveningCheckIn < range.end);
  });
});

describe('buildBillboardCheckInsUrl', () => {
  it('uses event-local day bounds instead of UTC Z midnight', () => {
    const url = buildBillboardCheckInsUrl(
      'https://api.planningcenteronline.com/check-ins/v2',
      '123',
      '2026-08-04',
      'America/Chicago'
    );

    assert.match(url, /where\[created_at\]\[gte\]=2026-08-04T05%3A00%3A00\.000Z/);
    assert.match(url, /where\[created_at\]\[lt\]=2026-08-05T05%3A00%3A00\.000Z/);
    assert.doesNotMatch(url, /T00:00:00Z/);
    assert.doesNotMatch(url, /T23:59:59Z/);
  });
});

describe('server route wiring', () => {
  const serverSource = fs.readFileSync(path.join(__dirname, '..', 'server.js'), 'utf8');

  it('wires billboard/check-ins through buildBillboardCheckInsUrl', () => {
    assert.match(serverSource, /buildBillboardCheckInsUrl/);
    assert.doesNotMatch(
      serverSource,
      /billboard\/check-ins[\s\S]{0,1200}T00:00:00Z&where\[created_at\]\[lt\]=/
    );
  });

  it('normalizes security-codes filter input before includes()', () => {
    assert.match(serverSource, /normalizedRequestedCodes/);
    assert.doesNotMatch(
      serverSource,
      /securityCodes\.includes\(checkIn\.attributes\.security_code\?\.toLowerCase\(\)\)/
    );
  });
});
