const assert = require('node:assert/strict');
const test = require('node:test');
const { getPossibleDateStrings, matchesEventDate } = require('../utils/dateMatching');

test('matches event date from UTC or local interpretation of created_at', () => {
  // 2026-07-26 23:30 UTC is still 2026-07-26 local in US, but could be next day in ahead zones.
  assert.equal(matchesEventDate('2026-07-26T23:30:00Z', '2026-07-26'), true);
  assert.equal(matchesEventDate('2026-07-27T15:00:00Z', '2026-07-27'), true);
});

test('rejects adjacent-day stale check-ins that ±1 day matching would accept', () => {
  // Saturday check-in must not match Sunday event date.
  assert.equal(matchesEventDate('2026-07-26T15:00:00Z', '2026-07-27'), false);
  assert.equal(matchesEventDate('2026-07-25T12:00:00Z', '2026-07-27'), false);
});

test('handles plain YYYY-MM-DD created_at values', () => {
  assert.equal(matchesEventDate('2026-07-27', '2026-07-27'), true);
  assert.equal(matchesEventDate('2026-07-26', '2026-07-27'), false);
  assert.deepEqual(Array.from(getPossibleDateStrings('2026-07-27')), ['2026-07-27']);
});

test('returns false for missing or invalid inputs', () => {
  assert.equal(matchesEventDate(null, '2026-07-27'), false);
  assert.equal(matchesEventDate('2026-07-27T15:00:00Z', null), false);
  assert.equal(matchesEventDate('not-a-date', '2026-07-27'), false);
});
