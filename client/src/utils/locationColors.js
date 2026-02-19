// Default color palette for location-based card borders
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
 * Get the border color for a billboard card based on notification and admin-assigned colors
 */
export function getCardBorderColor(notification, locationColors) {
  const locationId = notification?.locationId;
  
  if (locationColors && locationId && locationColors[locationId]) {
    return locationColors[locationId];
  }
  
  return getDefaultColorForLocation(locationId || notification?.locationName);
}
