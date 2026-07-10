const assert = require('node:assert/strict');
const test = require('node:test');

const { isSameEventDate } = require('./dateMatching');

test('rejects active check-ins from an adjacent event-local date', () => {
  assert.equal(
    isSameEventDate('2026-07-09T23:30:00Z', '2026-07-10', 'America/Chicago'),
    false
  );
});

test('accepts UTC rollover timestamps that are still on the event-local date', () => {
  assert.equal(
    isSameEventDate('2026-07-11T02:30:00Z', '2026-07-10', 'America/Chicago'),
    true
  );
});

test('rejects invalid timestamps instead of matching leniently', () => {
  assert.equal(isSameEventDate('not-a-date', '2026-07-10', 'America/Chicago'), false);
});
