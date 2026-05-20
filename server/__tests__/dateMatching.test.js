const assert = require('node:assert/strict');
const test = require('node:test');

const {
  getEventDateForTimestamp,
  isSameEventDate
} = require('../utils/dateMatching');

test('matches date-only check-in values exactly', () => {
  assert.equal(isSameEventDate('2026-05-20', '2026-05-20'), true);
  assert.equal(isSameEventDate('2026-05-19', '2026-05-20'), false);
});

test('rejects adjacent-day active check-ins with reused security codes', () => {
  assert.equal(isSameEventDate('2026-05-19T12:00:00Z', '2026-05-20'), false);
  assert.equal(isSameEventDate('2026-05-21T12:00:00Z', '2026-05-20'), false);
});

test('uses the event timezone so UTC rollover still matches the church event date', () => {
  const timestamp = '2026-05-21T01:30:00Z';

  assert.equal(getEventDateForTimestamp(timestamp, 'America/Chicago'), '2026-05-20');
  assert.equal(isSameEventDate(timestamp, '2026-05-20', 'America/Chicago'), true);
  assert.equal(isSameEventDate(timestamp, '2026-05-21', 'America/Chicago'), false);
});

test('handles timestamps with explicit offsets', () => {
  assert.equal(isSameEventDate('2026-05-20T23:30:00-05:00', '2026-05-20', 'America/Chicago'), true);
});
