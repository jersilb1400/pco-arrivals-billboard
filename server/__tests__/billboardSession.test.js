const test = require('node:test');
const assert = require('node:assert/strict');

const { shouldClearNotifications } = require('../utils/billboardSession');

test('preserves notifications when relaunching the same event date', () => {
  const activeBillboard = {
    eventId: 'event-1',
    eventDate: '2026-05-19'
  };

  assert.equal(
    shouldClearNotifications(activeBillboard, 'event-1', '2026-05-19'),
    false
  );
});

test('clears notifications when switching event date', () => {
  const activeBillboard = {
    eventId: 'event-1',
    eventDate: '2026-05-18'
  };

  assert.equal(
    shouldClearNotifications(activeBillboard, 'event-1', '2026-05-19'),
    true
  );
});

test('clears notifications when switching events', () => {
  const activeBillboard = {
    eventId: 'event-1',
    eventDate: '2026-05-19'
  };

  assert.equal(
    shouldClearNotifications(activeBillboard, 'event-2', '2026-05-19'),
    true
  );
});

test('clears orphaned notifications when no billboard is active', () => {
  assert.equal(
    shouldClearNotifications(null, 'event-1', '2026-05-19'),
    true
  );
});
