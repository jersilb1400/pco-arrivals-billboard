const assert = require('node:assert/strict');
const { describe, it } = require('node:test');

const {
  hasNonEmptyObject,
  sanitizeStationColors,
  sanitizeStationIcons
} = require('../utils/stationAssignments');

describe('station assignment updates', () => {
  it('does not treat empty assignment objects as a full replacement', () => {
    assert.equal(hasNonEmptyObject({}), false);
  });

  it('keeps valid station colors and drops invalid values', () => {
    assert.deepEqual(sanitizeStationColors({ a: '#AABBCC', b: 'red' }), { a: '#AABBCC' });
  });

  it('keeps valid station icons and drops invalid values', () => {
    assert.deepEqual(sanitizeStationIcons({ a: 'Star', b: 'NotAnIcon' }), { a: 'Star' });
  });
});
