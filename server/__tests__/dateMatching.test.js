const test = require('node:test');
const assert = require('node:assert/strict');

const { isCheckInOnEventDate } = require('../utils/dateMatching');

test('rejects active check-ins from an adjacent event date with the same security code', () => {
  assert.equal(isCheckInOnEventDate('2026-05-11T18:00:00Z', '2026-05-12'), false);
});

test('matches check-ins that fall on the event date in the event timezone', () => {
  assert.equal(isCheckInOnEventDate('2026-05-12T05:30:00Z', '2026-05-12'), true);
});

test('matches offset timestamps by their event-timezone calendar date', () => {
  assert.equal(isCheckInOnEventDate('2026-05-12T00:30:00-05:00', '2026-05-12'), true);
});
