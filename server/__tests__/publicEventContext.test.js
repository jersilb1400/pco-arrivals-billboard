const assert = require('node:assert/strict');
const test = require('node:test');

const { resolvePublicEventContext } = require('../utils/publicEventContext');

const activeBillboard = {
  eventId: 'event-1',
  eventDate: '2026-06-02'
};

test('uses the active billboard event when no event is requested', () => {
  assert.deepEqual(resolvePublicEventContext(activeBillboard), {
    ok: true,
    eventId: 'event-1',
    eventDate: '2026-06-02'
  });
});

test('rejects requests for a different event or date', () => {
  assert.equal(resolvePublicEventContext(activeBillboard, { eventId: 'event-2' }).status, 403);
  assert.equal(resolvePublicEventContext(activeBillboard, { eventId: 'event-1', eventDate: '2026-06-03' }).status, 403);
});

test('requires an active billboard event and date', () => {
  assert.equal(resolvePublicEventContext(null).status, 409);
  assert.equal(resolvePublicEventContext({ eventId: 'event-1' }).status, 409);
});
