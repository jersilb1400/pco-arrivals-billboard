const assert = require('node:assert/strict');
const test = require('node:test');

const { shouldClearNotifications } = require('../utils/billboardSession');

test('does not clear pickup notifications when relaunching the same event session', () => {
  const currentState = {
    activeBillboard: {
      eventId: 'event-1',
      eventDate: '2026-05-13'
    }
  };

  assert.equal(
    shouldClearNotifications(currentState, 'event-1', '2026-05-13'),
    false
  );
});

test('clears pickup notifications when changing event sessions', () => {
  const currentState = {
    activeBillboard: {
      eventId: 'event-1',
      eventDate: '2026-05-13'
    }
  };

  assert.equal(
    shouldClearNotifications(currentState, 'event-2', '2026-05-13'),
    true
  );
});

test('clears pickup notifications when changing event dates', () => {
  const currentState = {
    activeBillboard: {
      eventId: 'event-1',
      eventDate: '2026-05-13'
    }
  };

  assert.equal(
    shouldClearNotifications(currentState, 'event-1', '2026-05-14'),
    true
  );
});
