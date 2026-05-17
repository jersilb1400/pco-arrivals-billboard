const assert = require('node:assert/strict');
const { describe, it } = require('node:test');

const { isSameEventDate } = require('../utils/dateMatching');

describe('isSameEventDate', () => {
  it('rejects active check-ins from the previous event date', () => {
    assert.equal(
      isSameEventDate('2026-05-16T10:00:00-05:00', '2026-05-17', 'America/Chicago'),
      false
    );
  });

  it('matches UTC timestamps by the event timezone date', () => {
    assert.equal(
      isSameEventDate('2026-05-18T03:30:00.000Z', '2026-05-17', 'America/Chicago'),
      true
    );
  });

  it('does not accept the next UTC date just because it is within one day', () => {
    assert.equal(
      isSameEventDate('2026-05-18T03:30:00.000Z', '2026-05-18', 'America/Chicago'),
      false
    );
  });

  it('compares date-only values strictly', () => {
    assert.equal(isSameEventDate('2026-05-17', '2026-05-17', 'America/Chicago'), true);
    assert.equal(isSameEventDate('2026-05-16', '2026-05-17', 'America/Chicago'), false);
  });
});
