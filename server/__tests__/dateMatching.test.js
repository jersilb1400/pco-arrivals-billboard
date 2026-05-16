const test = require('node:test');
const assert = require('node:assert/strict');

const { isMatchingEventDate } = require('../utils/dateMatching');

test('rejects adjacent-day check-ins for the same event and security code', () => {
  assert.equal(
    isMatchingEventDate('2026-05-15T18:00:00.000Z', '2026-05-16', 'America/Chicago'),
    false
  );
});

test('matches check-ins that fall on the event date in the event time zone', () => {
  assert.equal(
    isMatchingEventDate('2026-05-17T04:30:00.000Z', '2026-05-16', 'America/Chicago'),
    true
  );
});

test('supports date-only values from the API', () => {
  assert.equal(isMatchingEventDate('2026-05-16', '2026-05-16', 'America/Chicago'), true);
  assert.equal(isMatchingEventDate('2026-05-15', '2026-05-16', 'America/Chicago'), false);
});
