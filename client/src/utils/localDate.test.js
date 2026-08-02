import { formatLocalDateYYYYMMDD } from './localDate';

describe('formatLocalDateYYYYMMDD', () => {
  test('uses local calendar fields instead of UTC ISO date', () => {
    // 7:30pm America/Chicago on Aug 2 is already Aug 3 in UTC.
    const chicagoEveningUtc = new Date('2026-08-03T00:30:00.000Z');
    const utcIsoDay = chicagoEveningUtc.toISOString().split('T')[0];

    // In environments behind UTC, local Y/M/D must not follow the UTC day.
    const localDay = formatLocalDateYYYYMMDD(chicagoEveningUtc);
    expect(localDay).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(localDay).toBe(
      [
        chicagoEveningUtc.getFullYear(),
        String(chicagoEveningUtc.getMonth() + 1).padStart(2, '0'),
        String(chicagoEveningUtc.getDate()).padStart(2, '0'),
      ].join('-')
    );

    // Document the bug class: UTC ISO day can disagree with local day.
    if (
      chicagoEveningUtc.getFullYear() !== Number(utcIsoDay.slice(0, 4))
      || chicagoEveningUtc.getMonth() + 1 !== Number(utcIsoDay.slice(5, 7))
      || chicagoEveningUtc.getDate() !== Number(utcIsoDay.slice(8, 10))
    ) {
      expect(localDay).not.toBe(utcIsoDay);
    }
  });

  test('formats local calendar midnights without UTC day shift', () => {
    const localMidnight = new Date(2026, 7, 2, 0, 0, 0, 0);
    expect(formatLocalDateYYYYMMDD(localMidnight)).toBe('2026-08-02');
  });
});
