/**
 * Resolve a display name for a PCO CheckIn.
 *
 * One-time guests have no Person record; their names live on the CheckIn
 * attributes (first_name / last_name). Prefer an included Person when present.
 */
function resolveCheckInDisplayName(checkIn, person, fallback = 'Unknown Child') {
  if (person?.attributes) {
    const fromPerson = [person.attributes.first_name, person.attributes.last_name]
      .filter(Boolean)
      .join(' ')
      .trim();
    if (fromPerson) return fromPerson;
  }

  const attrs = checkIn?.attributes || {};
  const fromCheckIn =
    attrs.person_name ||
    [attrs.first_name, attrs.last_name].filter(Boolean).join(' ').trim();

  return fromCheckIn || fallback;
}

/**
 * Include active check-ins that have a location even when Person is missing
 * (one-time / label-only guests).
 */
function shouldIncludeLocatedCheckIn(location, person, checkIn) {
  if (!location) return false;
  if (person) return true;
  // One-time guests: location present, person absent — still count them.
  return Boolean(checkIn);
}

module.exports = {
  resolveCheckInDisplayName,
  shouldIncludeLocatedCheckIn
};
