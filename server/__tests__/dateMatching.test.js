const assert = require('node:assert/strict');
const test = require('node:test');

const { isSameEventDate } = require('../utils/dateMatching');

test('matches check-ins created on the selected event date', () => {
  assert.equal(isSameEventDate('2026-05-09T15:30:00Z', '2026-05-09'), true);
  assert.equal(isSameEventDate('2026-05-09', '2026-05-09'), true);
});

test('rejects adjacent-day active check-ins with the same security code', () => {
  assert.equal(isSameEventDate('2026-05-08T23:59:59Z', '2026-05-09'), false);
  assert.equal(isSameEventDate('2026-05-10T00:00:00Z', '2026-05-09'), false);
});

test('rejects missing or invalid dates', () => {
  assert.equal(isSameEventDate(null, '2026-05-09'), false);
  assert.equal(isSameEventDate('2026-05-09T15:30:00Z', null), false);
  assert.equal(isSameEventDate('not-a-date', '2026-05-09'), false);
});
