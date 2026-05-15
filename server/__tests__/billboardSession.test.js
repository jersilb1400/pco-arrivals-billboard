const test = require('node:test');
const assert = require('node:assert/strict');

const { shouldClearNotifications } = require('../utils/billboardSession');

test('clears notifications when there is no active billboard session', () => {
  assert.equal(
    shouldClearNotifications(null, { eventId: 'event-1', eventDate: '2026-05-15' }),
    true
  );
});

test('keeps notifications when re-saving the same event and date', () => {
  const currentSession = {
    activeBillboard: {
      eventId: 'event-1',
      eventDate: '2026-05-15'
    }
  };

  assert.equal(
    shouldClearNotifications(currentSession, { eventId: 'event-1', eventDate: '2026-05-15' }),
    false
  );
});

test('clears notifications when switching event or date', () => {
  const currentSession = {
    activeBillboard: {
      eventId: 'event-1',
      eventDate: '2026-05-15'
    }
  };

  assert.equal(
    shouldClearNotifications(currentSession, { eventId: 'event-2', eventDate: '2026-05-15' }),
    true
  );
  assert.equal(
    shouldClearNotifications(currentSession, { eventId: 'event-1', eventDate: '2026-05-16' }),
    true
  );
});
