function requireAuth(req, res, next) {
  if (!req.session.accessToken) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  if (!req.session.user || !req.session.user.isAdmin) {
    return res.status(403).json({ error: 'Not authorized' });
  }
  next();
}

function requireAuthOnly(req, res, next) {
  if (!req.session.accessToken) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  next();
}

module.exports = { requireAuth, requireAuthOnly }; 