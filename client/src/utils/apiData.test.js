import { responseArrayOrFallback } from './apiData';

describe('responseArrayOrFallback', () => {
  test('returns array data from a successful response', () => {
    expect(responseArrayOrFallback({ data: ['current'] }, ['previous'])).toEqual(['current']);
  });

  test('keeps fallback when data is null (429)', () => {
    expect(responseArrayOrFallback({ data: null }, ['previous'])).toEqual(['previous']);
  });

  test('keeps fallback when data is a non-array object', () => {
    expect(responseArrayOrFallback({ data: { error: 'Rate limited' } }, ['previous'])).toEqual([
      'previous'
    ]);
  });
});
