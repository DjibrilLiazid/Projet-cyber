// middleware/auth.js
// ================================================
// OWASP A01 - Broken Access Control
// Middleware de vérification d'authentification et de rôles
// ================================================

/**
 * Vérifie que l'utilisateur est connecté.
 * Redirige vers /auth/login si ce n'est pas le cas.
 */
function requireAuth(req, res, next) {
  if (!req.session || !req.session.userId) {
    req.flash('error', 'Vous devez être connecté pour accéder à cette page.');
    return res.redirect('/auth/login');
  }
  next();
}

/**
 * Vérifie que l'utilisateur est admin.
 * Renvoie 403 si l'utilisateur n'a pas le bon rôle.
 * Ne révèle pas l'existence de la page (pas de redirect vers login).
 */
function requireAdmin(req, res, next) {
  if (!req.session || !req.session.userId) {
    req.flash('error', 'Accès non autorisé.');
    return res.redirect('/auth/login');
  }

  // Vérification stricte du rôle côté serveur
  // On ne se fie JAMAIS à un cookie ou paramètre client pour le rôle
  if (req.session.role !== 'admin') {
    return res.status(403).render('error', {
      code: 403,
      message: 'Accès interdit — droits administrateur requis.',
      user: req.session.username || null
    });
  }

  next();
}

/**
 * Injecte les infos de session dans res.locals
 * pour les utiliser dans toutes les vues EJS.
 */
function injectUser(req, res, next) {
  res.locals.currentUser = req.session.userId ? {
    id:       req.session.userId,
    username: req.session.username,
    role:     req.session.role,
  } : null;
  res.locals.isAdmin = req.session.role === 'admin';
  res.locals.flashSuccess = req.flash('success');
  res.locals.flashError   = req.flash('error');
  next();
}

module.exports = { requireAuth, requireAdmin, injectUser };
