
function requireAuth(req, res, next) {
  if (!req.session || !req.session.userId) {
    req.flash('error', 'Vous devez être connecté pour accéder à cette page.');
    return res.redirect('/auth/login');
  }
  next();
}


function requireAdmin(req, res, next) {
  if (!req.session || !req.session.userId) {
    req.flash('error', 'Accès non autorisé.');
    return res.redirect('/auth/login');
  }


  if (req.session.role !== 'admin') {
    return res.status(403).render('error', {
      title: 'Erreur 403',
      code: 403,
      message: 'Accès interdit — droits administrateur requis.',
      user: req.session.username || null
    });
  }

  next();
}


function injectUser(req, res, next) {
  res.locals.currentUser = req.session.userId ? {
    id: req.session.userId,
    username: req.session.username,
    role: req.session.role,
  } : null;
  res.locals.isAdmin = req.session.role === 'admin';
  res.locals.flashSuccess = req.flash('success');
  res.locals.flashError = req.flash('error');
  next();
}

module.exports = { requireAuth, requireAdmin, injectUser };
