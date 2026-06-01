const assert = require('node:assert/strict');
const test = require('node:test');

const { matchesEventDate } = require('../utils/dateMatching');

test('matches check-ins on the selected event date', () => {
  assert.equal(
    matchesEventDate('2026-06-01T15:30:00Z', '2026-06-01', 'America/Chicago'),
    true
  );
});

test('rejects active check-ins from adjacent days', () => {
  assert.equal(
    matchesEventDate('2026-05-31T15:30:00Z', '2026-06-01', 'America/Chicago'),
    false
  );
  assert.equal(
    matchesEventDate('2026-06-02T15:30:00Z', '2026-06-01', 'America/Chicago'),
    false
  );
});

test('matches using the event time zone instead of the UTC day', () => {
  assert.equal(
    matchesEventDate('2026-06-02T04:30:00Z', '2026-06-01', 'America/Chicago'),
    true
  );
});

test('returns false for invalid or missing dates', () => {
  assert.equal(matchesEventDate(null, '2026-06-01', 'America/Chicago'), false);
  assert.equal(matchesEventDate('not-a-date', '2026-06-01', 'America/Chicago'), false);
  assert.equal(matchesEventDate('2026-06-01T15:30:00Z', null, 'America/Chicago'), false);
});
