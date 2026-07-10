function mapToObject(value) {
  if (!value) {
    return {};
  }

  if (value instanceof Map) {
    return value.size > 0 ? Object.fromEntries(value) : {};
  }

  if (typeof value.toObject === 'function') {
    const objectValue = value.toObject();
    return objectValue && Object.keys(objectValue).length > 0 ? objectValue : {};
  }

  if (typeof value === 'object') {
    return Object.keys(value).length > 0 ? { ...value } : {};
  }

  return {};
}

function firstNonEmptyMap(value, fallback) {
  const mapped = mapToObject(value);
  return Object.keys(mapped).length > 0 ? mapped : (fallback || {});
}

function buildHydratedBillboard(activeBillboard, locationColorDoc, stationColorDoc) {
  if (!activeBillboard) {
    return activeBillboard;
  }

  return {
    ...activeBillboard,
    locationColors: firstNonEmptyMap(locationColorDoc?.assignments, activeBillboard.locationColors),
    stationColors: firstNonEmptyMap(stationColorDoc?.assignments, activeBillboard.stationColors),
    stationIcons: firstNonEmptyMap(stationColorDoc?.icons, activeBillboard.stationIcons)
  };
}

function resolveField(previousActiveBillboard, eventId, nextValue, fieldName) {
  if (nextValue !== undefined) {
    return nextValue || {};
  }

  if (previousActiveBillboard?.eventId === eventId) {
    return previousActiveBillboard[fieldName] || {};
  }

  return {};
}

function resolveBillboardVisualState(previousActiveBillboard, eventId, locationColors, stationColors, stationIcons) {
  return {
    locationColors: resolveField(previousActiveBillboard, eventId, locationColors, 'locationColors'),
    stationColors: resolveField(previousActiveBillboard, eventId, stationColors, 'stationColors'),
    stationIcons: resolveField(previousActiveBillboard, eventId, stationIcons, 'stationIcons')
  };
}

function shouldPersistStationState(selectedStationIds, stationColors, stationIcons) {
  return (Array.isArray(selectedStationIds) && selectedStationIds.length > 0) ||
    (stationColors && typeof stationColors === 'object' && Object.keys(stationColors).length > 0) ||
    (stationIcons && typeof stationIcons === 'object' && Object.keys(stationIcons).length > 0);
}

module.exports = {
  buildHydratedBillboard,
  resolveBillboardVisualState,
  shouldPersistStationState
};
