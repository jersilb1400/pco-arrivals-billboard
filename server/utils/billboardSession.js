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

function resolveBillboardMetadata(currentBillboard, nextEventId, metadata = {}) {
  const shouldPreserveExisting = currentBillboard &&
    normalizeIdentityPart(currentBillboard.eventId) === normalizeIdentityPart(nextEventId);

  return {
    locationColors: metadata.locationColors || (shouldPreserveExisting ? currentBillboard.locationColors : {}) || {},
    stationColors: metadata.stationColors || (shouldPreserveExisting ? currentBillboard.stationColors : {}) || {},
    stationIcons: metadata.stationIcons || (shouldPreserveExisting ? currentBillboard.stationIcons : {}) || {}
  };
}

module.exports = {
  resolveBillboardMetadata,
  shouldClearNotifications
};
