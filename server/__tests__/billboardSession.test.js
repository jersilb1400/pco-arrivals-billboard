const assert = require('node:assert/strict');
const { describe, it } = require('node:test');

const { shouldClearNotifications } = require('../utils/billboardSession');

describe('shouldClearNotifications', () => {
  it('keeps pickup notifications when the same event session is refreshed', () => {
    const currentBillboard = {
      eventId: 'event-1',
      eventDate: '2026-05-17'
    };

    assert.equal(
      shouldClearNotifications(currentBillboard, {
        eventId: 'event-1',
        eventDate: '2026-05-17'
      }),
      false
    );
  });

  it('keeps pickup notifications when the same event is refreshed without a date payload', () => {
    const currentBillboard = {
      eventId: 'event-1',
      eventDate: '2026-05-17'
    };

    assert.equal(
      shouldClearNotifications(currentBillboard, {
        eventId: 'event-1'
      }),
      false
    );
  });

  it('clears pickup notifications when the active event changes', () => {
    const currentBillboard = {
      eventId: 'event-1',
      eventDate: '2026-05-17'
    };

    assert.equal(
      shouldClearNotifications(currentBillboard, {
        eventId: 'event-2',
        eventDate: '2026-05-17'
      }),
      true
    );
  });

  it('clears pickup notifications when the active event date changes', () => {
    const currentBillboard = {
      eventId: 'event-1',
      eventDate: '2026-05-17'
    };

    assert.equal(
      shouldClearNotifications(currentBillboard, {
        eventId: 'event-1',
        eventDate: '2026-05-18'
      }),
      true
    );
  });
});
