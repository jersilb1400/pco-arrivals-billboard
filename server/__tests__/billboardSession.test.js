const assert = require('node:assert/strict');
const { describe, it } = require('node:test');

const {
  resolveBillboardMetadata,
  shouldClearNotifications
} = require('../utils/billboardSession');

describe('shouldClearNotifications', () => {
  it('keeps pickup notifications when relaunching the same event and date', () => {
    const currentBillboard = { eventId: 123, eventDate: '2026-05-25' };

    assert.equal(shouldClearNotifications(currentBillboard, '123', '2026-05-25'), false);
  });

  it('clears pickup notifications when the active event changes', () => {
    const currentBillboard = { eventId: 123, eventDate: '2026-05-25' };

    assert.equal(shouldClearNotifications(currentBillboard, 456, '2026-05-25'), true);
  });

  it('clears pickup notifications when the active event date changes', () => {
    const currentBillboard = { eventId: 123, eventDate: '2026-05-25' };

    assert.equal(shouldClearNotifications(currentBillboard, 123, '2026-05-26'), true);
  });
});

describe('resolveBillboardMetadata', () => {
  it('preserves existing station metadata when same-event updates omit it', () => {
    const currentBillboard = {
      eventId: '123',
      locationColors: { room1: '#ff0000' },
      stationColors: { station1: '#00ff00' },
      stationIcons: { station1: 'Star' }
    };

    assert.deepEqual(resolveBillboardMetadata(currentBillboard, '123', {}), {
      locationColors: { room1: '#ff0000' },
      stationColors: { station1: '#00ff00' },
      stationIcons: { station1: 'Star' }
    });
  });

  it('does not carry station metadata into a different event', () => {
    const currentBillboard = {
      eventId: '123',
      locationColors: { room1: '#ff0000' },
      stationColors: { station1: '#00ff00' },
      stationIcons: { station1: 'Star' }
    };

    assert.deepEqual(resolveBillboardMetadata(currentBillboard, '456', {}), {
      locationColors: {},
      stationColors: {},
      stationIcons: {}
    });
  });
});
