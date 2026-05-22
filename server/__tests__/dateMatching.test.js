const test = require('node:test');
const assert = require('node:assert/strict');

const { matchesEventDate } = require('../utils/dateMatching');

test('rejects an active check-in from the prior event date', () => {
  assert.equal(
    matchesEventDate('2026-05-21T18:30:00-05:00', '2026-05-22', 'America/Chicago'),
    false
  );
});

test('matches check-ins by the event timezone instead of adjacent UTC dates', () => {
  assert.equal(
    matchesEventDate('2026-05-22T01:30:00Z', '2026-05-21', 'America/Chicago'),
    true
  );

  assert.equal(
    matchesEventDate('2026-05-22T01:30:00Z', '2026-05-22', 'America/Chicago'),
    false
  );
});
