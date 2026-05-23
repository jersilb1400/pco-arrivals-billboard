const assert = require('node:assert/strict');
const test = require('node:test');

const { shouldClearNotifications } = require('../utils/billboardSession');

test('preserves active notifications when re-saving the same event and date', () => {
  const currentState = {
    activeBillboard: {
      eventId: 'event-1',
      eventDate: '2026-05-23'
    }
  };

  assert.equal(shouldClearNotifications(currentState, 'event-1', '2026-05-23'), false);
});

test('clears active notifications when switching event sessions', () => {
  const currentState = {
    activeBillboard: {
      eventId: 'event-1',
      eventDate: '2026-05-23'
    }
  };

  assert.equal(shouldClearNotifications(currentState, 'event-2', '2026-05-23'), true);
});

test('clears active notifications when switching event dates', () => {
  const currentState = {
    activeBillboard: {
      eventId: 'event-1',
      eventDate: '2026-05-23'
    }
  };

  assert.equal(shouldClearNotifications(currentState, 'event-1', '2026-05-24'), true);
});
