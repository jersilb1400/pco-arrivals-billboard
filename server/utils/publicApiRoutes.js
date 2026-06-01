const PUBLIC_API_ROUTES = new Set([
  'GET /auth-status',
  'GET /debug/env',
  'POST /auth/login',
  'GET /global-billboard',
  'GET /active-notifications',
  'GET /location-status',
  'POST /security-code-entry'
]);

function isPublicApiRoute(method, path) {
  return PUBLIC_API_ROUTES.has(`${String(method).toUpperCase()} ${path}`);
}

module.exports = {
  isPublicApiRoute
};
