const { shouldClearNotifications } = require('../utils/billboardSession');

describe('shouldClearNotifications', () => {
  test('clears when there is no existing active billboard', () => {
    expect(shouldClearNotifications(null, '100', '2026-04-08')).toBe(true);
  });

  test('does not clear when event and date are unchanged', () => {
    const current = { eventId: '100', eventDate: '2026-04-08' };
    expect(shouldClearNotifications(current, '100', '2026-04-08')).toBe(false);
  });

  test('does not clear when event id type differs but value matches', () => {
    const current = { eventId: 100, eventDate: '2026-04-08' };
    expect(shouldClearNotifications(current, '100', '2026-04-08')).toBe(false);
  });

  test('clears when event id changes', () => {
    const current = { eventId: '100', eventDate: '2026-04-08' };
    expect(shouldClearNotifications(current, '101', '2026-04-08')).toBe(true);
  });

  test('clears when event date changes', () => {
    const current = { eventId: '100', eventDate: '2026-04-08' };
    expect(shouldClearNotifications(current, '100', '2026-04-09')).toBe(true);
  });

  test('treats empty or undefined date as equivalent', () => {
    const current = { eventId: '100', eventDate: undefined };
    expect(shouldClearNotifications(current, '100', '')).toBe(false);
  });
});
