const test = require('node:test');
const assert = require('node:assert/strict');

const { checkInMatchesEventDate } = require('../utils/dateMatching');

test('rejects a prior-day check-in for the same event date', () => {
  assert.equal(
    checkInMatchesEventDate('2026-05-17T15:30:00-05:00', '2026-05-18'),
    false
  );
});

test('accepts a check-in on the selected event date', () => {
  assert.equal(
    checkInMatchesEventDate('2026-05-18T15:30:00-05:00', '2026-05-18'),
    true
  );
});

test('matches event date in the configured event timezone across UTC rollover', () => {
  assert.equal(
    checkInMatchesEventDate('2026-05-19T04:30:00.000Z', '2026-05-18', 'America/Chicago'),
    true
  );
});
