const test = require('node:test');
const assert = require('node:assert/strict');

const { isCheckInOnEventDate } = require('../utils/dateMatching');

test('matches check-ins that fall on the event date in the event timezone', () => {
  assert.equal(
    isCheckInOnEventDate('2026-05-15T10:30:00-05:00', '2026-05-15', 'America/Chicago'),
    true
  );
});

test('does not match active check-ins from the previous local event date', () => {
  assert.equal(
    isCheckInOnEventDate('2026-05-14T10:00:00-05:00', '2026-05-15', 'America/Chicago'),
    false
  );
});

test('does not match active check-ins from the next local event date', () => {
  assert.equal(
    isCheckInOnEventDate('2026-05-16T10:00:00-05:00', '2026-05-15', 'America/Chicago'),
    false
  );
});

test('keeps late evening central check-ins on their local event date despite UTC rollover', () => {
  assert.equal(
    isCheckInOnEventDate('2026-05-15T23:30:00-05:00', '2026-05-15', 'America/Chicago'),
    true
  );
});
