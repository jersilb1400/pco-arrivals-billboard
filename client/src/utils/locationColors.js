// Default color palette for location-based card borders and station badges
export const DEFAULT_PALETTE = [
  '#2563eb', // blue
  '#059669', // emerald
  '#d97706', // amber
  '#7c3aed', // violet
  '#dc2626', // red
  '#0891b2', // cyan
  '#ca8a04', // yellow
  '#db2777', // pink
  '#4f46e5', // indigo
  '#0d9488'  // teal
];

// Slightly different palette for stations (distinct from locations)
export const DEFAULT_STATION_PALETTE = [
  '#6366f1', // indigo
  '#14b8a6', // teal
  '#f59e0b', // amber
  '#8b5cf6', // violet
  '#ef4444', // red
  '#06b6d4', // cyan
  '#eab308', // yellow
  '#ec4899', // pink
  '#3b82f6', // blue
  '#10b981'  // emerald
];

/**
 * Get a deterministic default color for a location when no admin assignment exists
 */
export function getDefaultColorForLocation(locationId) {
  if (!locationId) return '#6b7280'; // gray for unknown
  const str = String(locationId);
  const hash = str.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return DEFAULT_PALETTE[Math.abs(hash) % DEFAULT_PALETTE.length];
}

/**
 * Get a deterministic default color for a station when no admin assignment exists
 */
export function getDefaultColorForStation(stationId) {
  if (!stationId) return '#6b7280'; // gray for unknown
  const str = String(stationId);
  const hash = str.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return DEFAULT_STATION_PALETTE[Math.abs(hash) % DEFAULT_STATION_PALETTE.length];
}

/**
 * Get the border color for a billboard card based on notification and admin-assigned colors (for room/location)
 */
export function getCardBorderColor(notification, locationColors) {
  const locationId = notification?.locationId;
  
  if (locationColors && locationId && locationColors[locationId]) {
    return locationColors[locationId];
  }
  
  return getDefaultColorForLocation(locationId || notification?.locationName);
}

/**
 * Get the color for a check-in station badge based on notification and admin-assigned station colors
 */
export function getStationColor(notification, stationColors) {
  const stationId = notification?.stationId;
  
  if (stationColors && stationId && stationColors[stationId]) {
    return stationColors[stationId];
  }
  
  return getDefaultColorForStation(stationId || notification?.stationName);
}
