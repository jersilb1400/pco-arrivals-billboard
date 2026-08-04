/**
 * Resolve auth-status poll results without treating transient failures as logout.
 *
 * @param {object} params
 * @param {object|null} params.previousSession
 * @param {object|null|undefined} params.responseData - Successful response body (may be null on 429)
 * @param {Error|null|undefined} params.error - Thrown/rejected error, if any
 * @param {boolean} params.hasCredentials - Whether API key + user id exist in storage
 * @returns {{ session: object, shouldReloadForLogout: boolean }}
 */
export function resolveSessionCheckResult({
  previousSession,
  responseData,
  error,
  hasCredentials
}) {
  if (!hasCredentials) {
    return {
      session: { authenticated: false },
      shouldReloadForLogout: Boolean(previousSession?.authenticated)
    };
  }

  if (error) {
    // Network / 5xx / timeout: keep last known good session
    if (previousSession?.authenticated) {
      return {
        session: previousSession,
        shouldReloadForLogout: false
      };
    }
    return {
      session: previousSession || { authenticated: false },
      shouldReloadForLogout: false
    };
  }

  // 429 interceptor resolves with data:null — do not treat as logout
  if (responseData == null) {
    if (previousSession?.authenticated) {
      return {
        session: previousSession,
        shouldReloadForLogout: false
      };
    }
    return {
      session: previousSession || { authenticated: false },
      shouldReloadForLogout: false
    };
  }

  const wasAuthenticated = Boolean(previousSession?.authenticated);
  const isAuthenticated = Boolean(responseData.authenticated);

  return {
    session: responseData,
    shouldReloadForLogout: wasAuthenticated && !isAuthenticated
  };
}
