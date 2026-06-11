const PUBLIC_API_ROUTES = [
  { method: 'GET', path: '/auth-status' },
  { method: 'GET', path: '/debug/env' },
  { method: 'POST', path: '/auth/login' },
  { method: 'GET', path: '/global-billboard' },
  { method: 'POST', path: '/security-code-entry' },
  { method: 'GET', path: '/active-notifications' },
  { method: 'GET', path: '/location-status' }
];

function isPublicApiRoute(method, requestPath) {
  if (String(method).toUpperCase() === 'OPTIONS') {
    return true;
  }

  return PUBLIC_API_ROUTES.some(route =>
    route.method === String(method).toUpperCase() && route.path === requestPath
  );
}

function getActiveBillboardScope(globalBillboardState) {
  const activeBillboard = globalBillboardState?.activeBillboard;
  if (!activeBillboard?.eventId || !activeBillboard?.eventDate) {
    return null;
  }

  return {
    eventId: activeBillboard.eventId,
    eventDate: activeBillboard.eventDate
  };
}

function publicRequestMatchesActiveBillboard(scope, globalBillboardState) {
  const activeScope = getActiveBillboardScope(globalBillboardState);
  if (!activeScope || !scope?.eventId || !scope?.eventDate) {
    return false;
  }

  return String(scope.eventId) === String(activeScope.eventId) &&
    String(scope.eventDate) === String(activeScope.eventDate);
}

function sanitizeGlobalBillboardForPublic(globalBillboardState) {
  const activeBillboard = globalBillboardState?.activeBillboard;
  if (!activeBillboard) {
    return {
      activeBillboard: null,
      lastUpdated: globalBillboardState?.lastUpdated || null
    };
  }

  const {
    securityCodes,
    ...safeBillboard
  } = activeBillboard;

  return {
    activeBillboard: safeBillboard,
    lastUpdated: globalBillboardState?.lastUpdated || null
  };
}

module.exports = {
  getActiveBillboardScope,
  isPublicApiRoute,
  publicRequestMatchesActiveBillboard,
  sanitizeGlobalBillboardForPublic
};
