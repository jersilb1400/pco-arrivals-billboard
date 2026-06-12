const test = require('node:test');
const assert = require('node:assert/strict');

const { isSameEventDate } = require('../utils/dateMatching');

test('rejects active check-ins from the previous event date', () => {
  assert.equal(
    isSameEventDate('2026-05-18T12:00:00-05:00', '2026-05-19', 'America/Chicago'),
    false
  );
});

test('matches check-ins whose UTC date rolls into the next day but local event date does not', () => {
  assert.equal(
    isSameEventDate('2026-05-20T02:30:00Z', '2026-05-19', 'America/Chicago'),
    true
  );
});

test('rejects check-ins whose local event date is the next day', () => {
  assert.equal(
    isSameEventDate('2026-05-20T05:30:00Z', '2026-05-19', 'America/Chicago'),
    false
  );
});

test('matches date-only check-in values exactly', () => {
  assert.equal(
    isSameEventDate('2026-05-19', '2026-05-19', 'America/Chicago'),
    true
  );
});
