import { resolveSessionCheckResult } from './sessionStatus';

describe('resolveSessionCheckResult', () => {
  const authed = { authenticated: true, user: { id: '1', name: 'Admin' } };

  test('preserves authenticated session when auth-status returns null (429)', () => {
    const result = resolveSessionCheckResult({
      previousSession: authed,
      responseData: null,
      error: null,
      hasCredentials: true
    });

    expect(result.session).toEqual(authed);
    expect(result.shouldReloadForLogout).toBe(false);
  });

  test('preserves authenticated session on network/transient errors', () => {
    const result = resolveSessionCheckResult({
      previousSession: authed,
      responseData: undefined,
      error: new Error('Network Error'),
      hasCredentials: true
    });

    expect(result.session).toEqual(authed);
    expect(result.shouldReloadForLogout).toBe(false);
  });

  test('accepts definitive unauthenticated response and signals logout reload', () => {
    const result = resolveSessionCheckResult({
      previousSession: authed,
      responseData: { authenticated: false, user: null },
      error: null,
      hasCredentials: true
    });

    expect(result.session).toEqual({ authenticated: false, user: null });
    expect(result.shouldReloadForLogout).toBe(true);
  });

  test('clears session when credentials are missing', () => {
    const result = resolveSessionCheckResult({
      previousSession: authed,
      responseData: null,
      error: null,
      hasCredentials: false
    });

    expect(result.session).toEqual({ authenticated: false });
    expect(result.shouldReloadForLogout).toBe(true);
  });
});
