const { getPossibleDateStrings, matchesEventDate } = require('../utils/dateMatching');

describe('dateMatching utilities', () => {
  test('matches exact YYYY-MM-DD strings', () => {
    expect(matchesEventDate('2026-03-27', '2026-03-27')).toBe(true);
    expect(matchesEventDate('2026-03-26', '2026-03-27')).toBe(false);
  });

  test('rejects adjacent-day check-ins (prevents stale pickup matches)', () => {
    const createdAt = '2026-03-26T15:30:00Z';
    const possibleDates = getPossibleDateStrings(createdAt);

    expect(possibleDates.has('2026-03-26')).toBe(true);
    expect(matchesEventDate(createdAt, '2026-03-27')).toBe(false);
  });

  test('accepts UTC-derived date for timestamp values', () => {
    expect(matchesEventDate('2026-03-27T01:05:00Z', '2026-03-27')).toBe(true);
  });

  test('returns false for invalid eventDate format', () => {
    expect(matchesEventDate('2026-03-27T01:05:00Z', '03/27/2026')).toBe(false);
  });
});
