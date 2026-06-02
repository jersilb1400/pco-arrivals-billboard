const PUBLIC_API_ROUTES = new Set([
  'GET /auth-status',
  'GET /debug/env',
  'POST /auth/login',
  'GET /global-billboard',
  'GET /billboard-updates',
  'POST /security-code-entry',
  'GET /active-notifications',
  'GET /location-status'
]);

function isPublicApiPath(method, pathname) {
  return PUBLIC_API_ROUTES.has(`${String(method).toUpperCase()} ${pathname}`);
}

module.exports = {
  isPublicApiPath
};
