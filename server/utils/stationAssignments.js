const VALID_ICON_NAMES = [
  'Star',
  'Favorite',
  'Home',
  'Flag',
  'Bolt',
  'Diamond',
  'EmojiEvents',
  'LocalFireDepartment',
  'WbSunny',
  'Park',
  'AutoAwesome',
  'RocketLaunch'
];

function hasNonEmptyObject(value) {
  return !!value && typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length > 0;
}

function sanitizeStationColors(stationColors) {
  const hexPattern = /^#[0-9A-Fa-f]{6}$/;
  const validated = {};

  for (const [id, color] of Object.entries(stationColors || {})) {
    if (color && hexPattern.test(color)) {
      validated[id] = color;
    }
  }

  return validated;
}

function sanitizeStationIcons(stationIcons) {
  const validIcons = {};

  for (const [id, icon] of Object.entries(stationIcons || {})) {
    if (icon && VALID_ICON_NAMES.includes(icon)) {
      validIcons[id] = icon;
    }
  }

  return validIcons;
}

module.exports = {
  hasNonEmptyObject,
  sanitizeStationColors,
  sanitizeStationIcons
};
