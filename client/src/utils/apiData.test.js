import { responseArrayOrFallback } from './apiData';

describe('responseArrayOrFallback', () => {
  it('returns array response data', () => {
    expect(responseArrayOrFallback({ data: ['current'] }, ['previous'])).toEqual(['current']);
  });

  it('preserves the fallback when response data is null', () => {
    expect(responseArrayOrFallback({ data: null }, ['previous'])).toEqual(['previous']);
  });

  it('preserves the fallback when response data is an object', () => {
    expect(responseArrayOrFallback({ data: { error: 'Rate limited' } }, ['previous'])).toEqual(['previous']);
  });
});
