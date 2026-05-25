function normalizeIdentityPart(value) {
  return value == null ? '' : String(value);
}

function isSameBillboardSession(currentBillboard, nextEventId, nextEventDate) {
  if (!currentBillboard) {
    return false;
  }

  return normalizeIdentityPart(currentBillboard.eventId) === normalizeIdentityPart(nextEventId) &&
    normalizeIdentityPart(currentBillboard.eventDate) === normalizeIdentityPart(nextEventDate);
}

function shouldClearNotifications(currentBillboard, nextEventId, nextEventDate) {
  if (!currentBillboard) {
    return false;
  }

  return !isSameBillboardSession(currentBillboard, nextEventId, nextEventDate);
}

function hasNonEmptyObject(value) {
  return !!value && typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length > 0;
}

function pickMetadata(provided, existing, shouldPreserveExisting) {
  if (hasNonEmptyObject(provided)) {
    return provided;
  }

  return shouldPreserveExisting ? existing || {} : {};
}

function resolveBillboardMetadata(currentBillboard, nextEventId, metadata = {}) {
  const shouldPreserveExisting = currentBillboard &&
    normalizeIdentityPart(currentBillboard.eventId) === normalizeIdentityPart(nextEventId);

  return {
    locationColors: pickMetadata(metadata.locationColors, currentBillboard?.locationColors, shouldPreserveExisting),
    stationColors: pickMetadata(metadata.stationColors, currentBillboard?.stationColors, shouldPreserveExisting),
    stationIcons: pickMetadata(metadata.stationIcons, currentBillboard?.stationIcons, shouldPreserveExisting)
  };
}

module.exports = {
  resolveBillboardMetadata,
  shouldClearNotifications
};
