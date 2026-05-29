const test = require('node:test');
const assert = require('node:assert/strict');

const { isCheckInOnEventDate } = require('../utils/dateMatching');

test('rejects active check-ins from the previous event date', () => {
  assert.equal(
    isCheckInOnEventDate('2026-02-23T18:00:00-06:00', '2026-02-24', 'America/Chicago'),
    false
  );
});

test('matches a UTC timestamp that falls on the event date in the event timezone', () => {
  assert.equal(
    isCheckInOnEventDate('2026-02-25T03:30:00Z', '2026-02-24', 'America/Chicago'),
    true
  );
});

test('matches date-only check-in values exactly', () => {
  assert.equal(
    isCheckInOnEventDate('2026-02-24', '2026-02-24', 'America/Chicago'),
    true
  );
});

test('rejects invalid or missing dates', () => {
  assert.equal(isCheckInOnEventDate(null, '2026-02-24', 'America/Chicago'), false);
  assert.equal(isCheckInOnEventDate('2026-02-24T10:00:00Z', '', 'America/Chicago'), false);
  assert.equal(isCheckInOnEventDate('not-a-date', '2026-02-24', 'America/Chicago'), false);
});
