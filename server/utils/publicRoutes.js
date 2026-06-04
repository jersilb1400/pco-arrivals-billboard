const PUBLIC_API_ROUTES = new Set([
  'GET /auth-status',
  'POST /auth/login',
  'GET /debug/env',
  'GET /global-billboard',
  'GET /active-notifications',
  'GET /location-status',
  'GET /billboard/check-ins',
  'GET /billboard-updates',
  'POST /security-code-entry',
]);

function isPublicApiRequest(method, apiPath) {
  return PUBLIC_API_ROUTES.has(`${String(method).toUpperCase()} ${apiPath}`);
}

function isActiveBillboardRequest(activeBillboard, requestContext = {}) {
  if (!activeBillboard?.eventId) {
    return false;
  }

  if (requestContext.eventId && String(requestContext.eventId) !== String(activeBillboard.eventId)) {
    return false;
  }

  if (requestContext.eventDate && String(requestContext.eventDate) !== String(activeBillboard.eventDate || '')) {
    return false;
  }

  return true;
}

module.exports = {
  isActiveBillboardRequest,
  isPublicApiRequest,
};
