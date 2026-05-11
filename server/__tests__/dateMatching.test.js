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

test('matches the source timestamp date even when its UTC date rolls over', () => {
  assert.equal(
    checkInMatchesEventDate('2026-05-11T23:30:00-05:00', '2026-05-11'),
    true
  );
});
