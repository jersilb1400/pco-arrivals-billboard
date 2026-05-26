const assert = require('node:assert/strict');
const test = require('node:test');

const { isSameEventDate } = require('../utils/dateMatching');

test('rejects active check-ins from an adjacent calendar day', () => {
  assert.equal(
    isSameEventDate('2026-05-25T12:00:00Z', '2026-05-26', 'America/Chicago'),
    false
  );
});

test('matches check-ins by the event timezone date, not the UTC date', () => {
  assert.equal(
    isSameEventDate('2026-05-26T04:30:00Z', '2026-05-25', 'America/Chicago'),
    true
  );
});

test('date-only check-in timestamps must match the selected event date exactly', () => {
  assert.equal(isSameEventDate('2026-05-25', '2026-05-26', 'America/Chicago'), false);
  assert.equal(isSameEventDate('2026-05-26', '2026-05-26', 'America/Chicago'), true);
});
