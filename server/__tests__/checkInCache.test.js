const assert = require('node:assert/strict');
const test = require('node:test');

const { createCheckInCache } = require('../utils/checkInCache');

test('does not reuse cached check-ins across different selected dates', () => {
  const cache = createCheckInCache({ ttlMs: 30000 });
  const may25Data = { data: [{ id: 'may-25' }], included: [] };

  cache.set({ eventId: 'event-1', date: '2026-05-25', scope: 'location-status' }, may25Data);

  assert.equal(
    cache.get({ eventId: 'event-1', date: '2026-05-26', scope: 'location-status' }),
    null
  );
});

test('does not reuse cached check-ins across incompatible include shapes', () => {
  const cache = createCheckInCache({ ttlMs: 30000 });
  const securityCodeData = {
    data: [{ id: 'check-in-1' }],
    included: [{ type: 'Household', id: 'household-1' }]
  };

  cache.set({ eventId: 'event-1', scope: 'security-codes' }, securityCodeData);

  assert.equal(
    cache.get({ eventId: 'event-1', date: '2026-05-26', scope: 'location-status' }),
    null
  );
});

test('reuses cached check-ins for the same event, date, and scope', () => {
  const cache = createCheckInCache({ ttlMs: 30000 });
  const data = { data: [{ id: 'check-in-1' }], included: [] };

  cache.set({ eventId: 'event-1', date: '2026-05-26', scope: 'location-status' }, data);

  assert.deepEqual(
    cache.get({ eventId: 'event-1', date: '2026-05-26', scope: 'location-status' }),
    data
  );
});
