function mapToObject(mapValue) {
  return mapValue && mapValue.size > 0 ? Object.fromEntries(mapValue) : null;
}

function buildGlobalBillboardResponse(globalBillboardState, { locationColorDoc, stationColorDoc } = {}) {
  let responseData = { ...globalBillboardState };
  const activeBillboard = globalBillboardState.activeBillboard;

  if (!activeBillboard?.eventId) {
    return responseData;
  }

  const locationColors = mapToObject(locationColorDoc?.assignments) || activeBillboard.locationColors || {};
  const stationColors = mapToObject(stationColorDoc?.assignments) || activeBillboard.stationColors || {};
  const stationIcons = mapToObject(stationColorDoc?.icons) || activeBillboard.stationIcons || {};

  responseData = {
    ...responseData,
    activeBillboard: {
      ...activeBillboard,
      locationColors,
      stationColors,
      stationIcons
    }
  };

  return responseData;
}

module.exports = {
  buildGlobalBillboardResponse
};
