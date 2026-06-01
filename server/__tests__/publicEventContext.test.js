const assert = require('node:assert/strict');
const test = require('node:test');

const { resolvePublicEventContext } = require('../utils/publicEventContext');

test('uses the active billboard context for public requests', () => {
  const activeBillboard = {
    eventId: 'event-1',
    eventDate: '2026-06-01'
  };

  assert.deepEqual(resolvePublicEventContext(activeBillboard, {}), {
    ok: true,
    eventId: 'event-1',
    eventDate: '2026-06-01'
  });
  assert.deepEqual(resolvePublicEventContext(activeBillboard, {
    eventId: 'event-1',
    eventDate: '2026-06-01'
  }), {
    ok: true,
    eventId: 'event-1',
    eventDate: '2026-06-01'
  });
});

test('rejects public requests when there is no active event/date', () => {
  assert.equal(resolvePublicEventContext(null, {}).ok, false);
  assert.equal(resolvePublicEventContext({ eventId: 'event-1' }, {}).ok, false);
});

test('rejects public requests for a non-active event or date', () => {
  const activeBillboard = {
    eventId: 'event-1',
    eventDate: '2026-06-01'
  };

  assert.equal(resolvePublicEventContext(activeBillboard, {
    eventId: 'event-2',
    eventDate: '2026-06-01'
  }).ok, false);
  assert.equal(resolvePublicEventContext(activeBillboard, {
    eventId: 'event-1',
    eventDate: '2026-06-02'
  }).ok, false);
});
