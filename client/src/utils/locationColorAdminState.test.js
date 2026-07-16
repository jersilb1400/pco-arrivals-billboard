import {
  getLoadedLocationColorPayload,
  getLocationColorFetchResult,
  isSuccessfulLocationColorSaveResponse,
} from './locationColorAdminState';

describe('location color admin state', () => {
  test('rejects rate-limited fetches instead of treating them as empty assignments', () => {
    expect(getLocationColorFetchResult({ status: 429, data: null }, 'event-1')).toEqual({
      loaded: false,
    });
  });

  test('rejects a response for a different event', () => {
    expect(getLocationColorFetchResult({
      status: 200,
      data: {
        eventId: 'event-1',
        locationColors: { room: '#112233' },
      },
    }, 'event-2')).toEqual({ loaded: false });
  });

  test('accepts a valid empty assignment map', () => {
    expect(getLocationColorFetchResult({
      status: 200,
      data: {
        eventId: 'event-1',
        locationColors: {},
      },
    }, 'event-1')).toEqual({
      loaded: true,
      assignments: {},
    });
  });

  test('only returns a save payload loaded for the selected event', () => {
    expect(getLoadedLocationColorPayload(
      'event-2',
      'event-1',
      { room: '#112233' },
    )).toBeUndefined();
    expect(getLoadedLocationColorPayload(
      'event-1',
      'event-1',
      { room: '#112233' },
    )).toEqual({ room: '#112233' });
  });

  test('requires an explicit successful save response', () => {
    expect(isSuccessfulLocationColorSaveResponse({ status: 429, data: null })).toBe(false);
    expect(isSuccessfulLocationColorSaveResponse({
      status: 200,
      data: { success: true },
    })).toBe(true);
  });
});
