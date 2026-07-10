const assert = require('node:assert/strict');
const test = require('node:test');

const {
  buildHydratedBillboard,
  resolveBillboardVisualState,
  shouldPersistStationState
} = require('./stationState');

test('hydrates station icons from persisted station color document', () => {
  const activeBillboard = {
    eventId: 'event-1',
    eventName: 'Sunday',
    locationColors: {},
    stationColors: {},
    stationIcons: {}
  };
  const stationColorDoc = {
    assignments: new Map([['station-1', '#112233']]),
    icons: new Map([['station-1', 'Star']])
  };

  const result = buildHydratedBillboard(activeBillboard, null, stationColorDoc);

  assert.deepEqual(result.stationColors, { 'station-1': '#112233' });
  assert.deepEqual(result.stationIcons, { 'station-1': 'Star' });
});

test('preserves visual state for legacy same-event billboard updates with omitted fields', () => {
  const previousActiveBillboard = {
    eventId: 'event-1',
    locationColors: { location: '#abcdef' },
    stationColors: { station: '#123456' },
    stationIcons: { station: 'RocketLaunch' }
  };

  const result = resolveBillboardVisualState(previousActiveBillboard, 'event-1');

  assert.deepEqual(result.locationColors, { location: '#abcdef' });
  assert.deepEqual(result.stationColors, { station: '#123456' });
  assert.deepEqual(result.stationIcons, { station: 'RocketLaunch' });
});

test('does not carry visual state across different events when fields are omitted', () => {
  const previousActiveBillboard = {
    eventId: 'event-1',
    locationColors: { location: '#abcdef' },
    stationColors: { station: '#123456' },
    stationIcons: { station: 'RocketLaunch' }
  };

  const result = resolveBillboardVisualState(previousActiveBillboard, 'event-2');

  assert.deepEqual(result.locationColors, {});
  assert.deepEqual(result.stationColors, {});
  assert.deepEqual(result.stationIcons, {});
});

test('persists station state when only icons are supplied', () => {
  assert.equal(shouldPersistStationState(undefined, undefined, { station: 'Star' }), true);
});
