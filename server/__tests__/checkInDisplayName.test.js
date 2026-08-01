const test = require('node:test');
const assert = require('node:assert/strict');
const {
  resolveCheckInDisplayName,
  shouldIncludeLocatedCheckIn
} = require('../utils/checkInDisplayName');

test('uses Person name when included', () => {
  const person = { attributes: { first_name: 'Ada', last_name: 'Lovelace' } };
  const checkIn = { attributes: { first_name: 'Ignored', last_name: 'Guest' } };
  assert.equal(resolveCheckInDisplayName(checkIn, person), 'Ada Lovelace');
});

test('falls back to CheckIn first/last name for one-time guests', () => {
  const checkIn = {
    attributes: {
      first_name: 'Visitor',
      last_name: 'Kid',
      one_time_guest: true
    }
  };
  assert.equal(resolveCheckInDisplayName(checkIn, null), 'Visitor Kid');
  assert.equal(resolveCheckInDisplayName(checkIn, undefined), 'Visitor Kid');
});

test('falls back to person_name then Unknown Child', () => {
  assert.equal(
    resolveCheckInDisplayName({ attributes: { person_name: 'Label Only' } }, null),
    'Label Only'
  );
  assert.equal(resolveCheckInDisplayName({ attributes: {} }, null), 'Unknown Child');
});

test('location-status includes one-time guests with a location', () => {
  const location = { id: 'loc-1', attributes: { name: 'Nursery' } };
  const guestCheckIn = {
    id: 'ci-1',
    attributes: { first_name: 'Guest', last_name: 'Child', one_time_guest: true }
  };

  assert.equal(shouldIncludeLocatedCheckIn(location, null, guestCheckIn), true);
  assert.equal(shouldIncludeLocatedCheckIn(null, null, guestCheckIn), false);
  assert.equal(
    shouldIncludeLocatedCheckIn(location, { attributes: { first_name: 'Ada' } }, guestCheckIn),
    true
  );
});

test('server location-status requires person AND location (regression guard)', () => {
  const fs = require('fs');
  const path = require('path');
  const source = fs.readFileSync(path.join(__dirname, '..', 'server.js'), 'utf8');

  // The dual location-status processing blocks must not require person.
  const locationStatusBlocks = source.split("app.get('/api/location-status'")[1] || '';
  assert.ok(locationStatusBlocks.includes('resolveCheckInDisplayName'));
  assert.ok(locationStatusBlocks.includes('shouldIncludeLocatedCheckIn'));
  assert.equal(
    /if\s*\(\s*location\s*&&\s*person\s*\)/.test(locationStatusBlocks),
    false,
    'location-status must not require both location and person'
  );
});
