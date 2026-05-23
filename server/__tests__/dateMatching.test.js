const assert = require('node:assert/strict');
const test = require('node:test');

const { matchesEventDate } = require('../utils/dateMatching');

test('rejects active check-ins from the adjacent calendar day', () => {
  assert.equal(
    matchesEventDate('2026-05-22T15:00:00Z', '2026-05-23', { timeZone: 'America/Chicago' }),
    false
  );
});

test('accepts UTC rollover check-ins that are on the event date in the event timezone', () => {
  assert.equal(
    matchesEventDate('2026-05-24T04:30:00Z', '2026-05-23', { timeZone: 'America/Chicago' }),
    true
  );
});

test('rejects invalid or missing dates', () => {
  assert.equal(matchesEventDate(null, '2026-05-23'), false);
  assert.equal(matchesEventDate('2026-05-23T12:00:00Z', null), false);
  assert.equal(matchesEventDate('not-a-date', '2026-05-23'), false);
});
