export const getLocationColorFetchResult = (response, expectedEventId) => {
  const data = response?.data;
  const locationColors = data?.locationColors;

  if (
    response?.status === 429
    || String(data?.eventId || '') !== String(expectedEventId || '')
    || !locationColors
    || typeof locationColors !== 'object'
    || Array.isArray(locationColors)
  ) {
    return { loaded: false };
  }

  return {
    loaded: true,
    assignments: locationColors,
  };
};

export const getLoadedLocationColorPayload = (
  selectedEventId,
  loadedEventId,
  assignments,
) => (
  selectedEventId
  && String(selectedEventId) === String(loadedEventId)
    ? assignments
    : undefined
);

export const isSuccessfulLocationColorSaveResponse = (response) => (
  response?.status !== 429 && response?.data?.success === true
);
