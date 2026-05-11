const assert = require('node:assert/strict');
const test = require('node:test');

const { checkInMatchesEventDate } = require('../utils/dateMatching');

test('matches a check-in created on the selected event date', () => {
  assert.equal(
    checkInMatchesEventDate('2026-05-11T15:30:00Z', '2026-05-11'),
    true
  );
});

test('rejects active check-ins from the previous event date', () => {
  assert.equal(
    checkInMatchesEventDate('2026-05-10T15:30:00Z', '2026-05-11'),
    false
  );
});

test('rejects active check-ins from the next event date', () => {
  assert.equal(
    checkInMatchesEventDate('2026-05-12T15:30:00Z', '2026-05-11'),
    false
  );
});

test('matches a date-only check-in value exactly', () => {
  assert.equal(checkInMatchesEventDate('2026-05-11', '2026-05-11'), true);
});

test('matches the event timezone date when a UTC timestamp rolls over', () => {
  assert.equal(
    checkInMatchesEventDate('2026-05-12T04:30:00Z', '2026-05-11'),
    true
  );
});

test('rejects the UTC date when the event timezone date is previous day', () => {
  assert.equal(
    checkInMatchesEventDate('2026-05-12T04:30:00Z', '2026-05-12'),
    false
  );
});

test('matches an offset timestamp by its event timezone date', () => {
  assert.equal(
    checkInMatchesEventDate('2026-05-11T23:30:00-05:00', '2026-05-11'),
    true
  );
});

test('rejects adjacent UTC date for an offset timestamp', () => {
  assert.equal(
    checkInMatchesEventDate('2026-05-11T23:30:00-05:00', '2026-05-12'),
    false
  );
});

test('matches offset timestamps by event timezone instead of arbitrary source date', () => {
  assert.equal(
    checkInMatchesEventDate('2026-05-12T00:30:00+14:00', '2026-05-11'),
    true
  );

  assert.equal(
    checkInMatchesEventDate('2026-05-12T00:30:00+14:00', '2026-05-12'),
    false
  );
});
