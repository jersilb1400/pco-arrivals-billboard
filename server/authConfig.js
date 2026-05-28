const PUBLIC_API_ROUTES = new Set([
  'GET /auth-status',
  'GET /debug/env',
  'POST /auth/login',
  'GET /global-billboard',
  'GET /active-notifications',
  'POST /security-code-entry',
  'GET /location-status'
]);

function isPublicApiRequest(method, path) {
  return PUBLIC_API_ROUTES.has(`${method.toUpperCase()} ${path}`);
}

module.exports = {
  isPublicApiRequest
};
