const assert = require('node:assert/strict');
const test = require('node:test');

const { buildGlobalBillboardResponse } = require('../utils/globalBillboardResponse');

test('hydrates station icons from persisted station metadata', () => {
  const response = buildGlobalBillboardResponse(
    {
      activeBillboard: {
        eventId: 'event-1',
        locationColors: {},
        stationColors: {},
        stationIcons: {}
      },
      lastUpdated: 'now'
    },
    {
      stationColorDoc: {
        assignments: new Map([['station-1', '#123456']]),
        icons: new Map([['station-1', 'Star']])
      }
    }
  );

  assert.deepEqual(response.activeBillboard.stationIcons, {
    'station-1': 'Star'
  });
});

test('falls back to in-memory station icons when persistence has none', () => {
  const response = buildGlobalBillboardResponse({
    activeBillboard: {
      eventId: 'event-1',
      stationIcons: {
        'station-2': 'RocketLaunch'
      }
    }
  });

  assert.deepEqual(response.activeBillboard.stationIcons, {
    'station-2': 'RocketLaunch'
  });
});
