import {
  getStationFetchResult,
  isSuccessfulStationSaveResponse
} from './stationAdminState';

test('rejects rate-limited station fetch responses without replacing current state', () => {
  const result = getStationFetchResult({ status: 429, data: null });

  expect(result).toEqual({
    ok: false,
    message: 'Station assignments could not be loaded because the API is rate limited. Please try again shortly.'
  });
});

test('rejects null station fetch responses without treating them as an empty event', () => {
  const result = getStationFetchResult({ status: 200, data: null });

  expect(result.ok).toBe(false);
});

test('normalizes successful station fetch responses', () => {
  const result = getStationFetchResult({
    status: 200,
    data: {
      stations: [{ id: 'station-1' }],
      selectedStationIds: ['station-1'],
      stationColors: { 'station-1': '#123456' },
      stationIcons: { 'station-1': 'Star' }
    }
  });

  expect(result).toEqual({
    ok: true,
    state: {
      stations: [{ id: 'station-1' }],
      selectedStationIds: ['station-1'],
      stationColors: { 'station-1': '#123456' },
      stationIcons: { 'station-1': 'Star' }
    }
  });
});

test('does not treat a 429 station save response as successful', () => {
  expect(isSuccessfulStationSaveResponse({ status: 429, data: null })).toBe(false);
});
