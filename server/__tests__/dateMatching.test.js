const assert = require('node:assert/strict');
const test = require('node:test');

const { isSameEventDate } = require('../utils/dateMatching');

test('rejects previous-day check-ins for reused security codes', () => {
  assert.equal(
    isSameEventDate('2026-05-12T15:30:00-05:00', '2026-05-13'),
    false
  );
});

test('rejects next-day check-ins for reused security codes', () => {
  assert.equal(
    isSameEventDate('2026-05-14T08:15:00-05:00', '2026-05-13'),
    false
  );
});

test('matches same event date in the event timezone across UTC rollover', () => {
  assert.equal(
    isSameEventDate('2026-05-14T02:30:00Z', '2026-05-13', 'America/Chicago'),
    true
  );
});

test('matches bare PCO date strings exactly', () => {
  assert.equal(isSameEventDate('2026-05-13', '2026-05-13'), true);
  assert.equal(isSameEventDate('2026-05-12', '2026-05-13'), false);
});
