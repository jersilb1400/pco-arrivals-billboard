const assert = require('node:assert/strict');
const test = require('node:test');

const { dateInTimeZone, matchesEventDate } = require('../utils/dateMatching');

test('dateInTimeZone returns the event-local date', () => {
  assert.equal(dateInTimeZone('2026-06-02T02:30:00Z', 'America/Chicago'), '2026-06-01');
});

test('matchesEventDate rejects adjacent-day check-ins', () => {
  assert.equal(matchesEventDate('2026-06-01T12:00:00Z', '2026-06-02', 'America/Chicago'), false);
});

test('matchesEventDate accepts UTC rollover when local date matches the event date', () => {
  assert.equal(matchesEventDate('2026-06-02T02:30:00Z', '2026-06-01', 'America/Chicago'), true);
});
