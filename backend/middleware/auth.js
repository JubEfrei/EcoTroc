// Middleware pour vérifier l'authentification
function requireAuth(req, res, next) {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ error: 'Authentification requise' });
  }
  next();
}

// Middleware pour les erreurs
function errorHandler(err, req, res, next) {
  console.error(err.stack);
  res.status(500).json({ error: 'Une erreur est survenue' });
}

module.exports = {
  requireAuth,
  errorHandler
};
