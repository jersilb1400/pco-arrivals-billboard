const test = require('node:test');
const assert = require('node:assert/strict');

const { checkInMatchesEventDate } = require('../utils/dateMatching');

test('rejects stale adjacent-day check-ins for the same event', () => {
  assert.equal(
    checkInMatchesEventDate('2026-05-13T16:30:00-05:00', '2026-05-14'),
    false
  );
});

test('matches check-ins that fall on the selected event date in the event timezone', () => {
  assert.equal(
    checkInMatchesEventDate('2026-05-14T01:30:00Z', '2026-05-13', 'America/Chicago'),
    true
  );
});

test('rejects malformed or missing dates', () => {
  assert.equal(checkInMatchesEventDate(undefined, '2026-05-14'), false);
  assert.equal(checkInMatchesEventDate('2026-05-14T12:00:00Z', undefined), false);
  assert.equal(checkInMatchesEventDate('not-a-date', '2026-05-14'), false);
});
