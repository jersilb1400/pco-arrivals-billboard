import { resolveGlobalBillboardPoll } from './globalBillboardPoll';

describe('resolveGlobalBillboardPoll', () => {
  const previous = { eventId: 'evt-1', eventDate: '2026-08-04', eventName: 'Sunday' };

  test('keeps previous billboard when poll throws', () => {
    expect(
      resolveGlobalBillboardPoll({
        previous,
        responseData: undefined,
        error: new Error('Network Error')
      })
    ).toEqual(previous);
  });

  test('keeps previous billboard when response data is null (429)', () => {
    expect(
      resolveGlobalBillboardPoll({
        previous,
        responseData: null,
        error: null
      })
    ).toEqual(previous);
  });

  test('updates when server returns a new active billboard', () => {
    const next = { eventId: 'evt-2', eventDate: '2026-08-04', eventName: 'Evening' };
    expect(
      resolveGlobalBillboardPoll({
        previous,
        responseData: { activeBillboard: next },
        error: null
      })
    ).toEqual(next);
  });

  test('clears when server explicitly reports no active billboard', () => {
    expect(
      resolveGlobalBillboardPoll({
        previous,
        responseData: { activeBillboard: null },
        error: null
      })
    ).toBeNull();
  });
});
