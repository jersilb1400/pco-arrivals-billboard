const assert = require('node:assert/strict');
const { describe, it } = require('node:test');

const { doesCheckInMatchEventDate } = require('../utils/dateMatching');

describe('doesCheckInMatchEventDate', () => {
  it('rejects an active check-in from the previous event day', () => {
    assert.equal(
      doesCheckInMatchEventDate('2026-05-24T12:00:00-05:00', '2026-05-25', 'America/Chicago'),
      false
    );
  });

  it('matches timestamps by the event timezone instead of UTC date', () => {
    assert.equal(
      doesCheckInMatchEventDate('2026-05-25T01:30:00Z', '2026-05-24', 'America/Chicago'),
      true
    );
  });

  it('matches exact date-only check-in values', () => {
    assert.equal(doesCheckInMatchEventDate('2026-05-25', '2026-05-25', 'America/Chicago'), true);
    assert.equal(doesCheckInMatchEventDate('2026-05-24', '2026-05-25', 'America/Chicago'), false);
  });
});
