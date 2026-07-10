const RATE_LIMIT_MESSAGE = 'Station assignments could not be loaded because the API is rate limited. Please try again shortly.';
const INVALID_RESPONSE_MESSAGE = 'Station assignments could not be loaded. Please try again.';

export function getStationFetchResult(response) {
  if (response?.status === 429) {
    return {
      ok: false,
      message: RATE_LIMIT_MESSAGE
    };
  }

  const data = response?.data;
  if (!data || !Array.isArray(data.stations) || !Array.isArray(data.selectedStationIds)) {
    return {
      ok: false,
      message: INVALID_RESPONSE_MESSAGE
    };
  }

  return {
    ok: true,
    state: {
      stations: data.stations,
      selectedStationIds: data.selectedStationIds,
      stationColors: data.stationColors || {},
      stationIcons: data.stationIcons || {}
    }
  };
}

export function isSuccessfulStationSaveResponse(response) {
  return response?.status !== 429 && response?.data?.success === true;
}

export function getLoadedStationPayload({
  selectedEventId,
  loadedEventId,
  loadStatus,
  selectedStationIds,
  stationColors,
  stationIcons
}) {
  if (loadStatus !== 'loaded' || selectedEventId !== loadedEventId) {
    return {};
  }

  return {
    ...(selectedStationIds?.length > 0 ? { selectedStationIds } : {}),
    ...(stationColors && Object.keys(stationColors).length > 0 ? { stationColors } : {}),
    ...(stationIcons && Object.keys(stationIcons).length > 0 ? { stationIcons } : {})
  };
}
