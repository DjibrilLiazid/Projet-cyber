
require('dotenv').config();
const express = require('express');
const session = require('express-session');
const helmet = require('helmet');
const morgan = require('morgan');
const csrf = require('csurf');
const flash = require('connect-flash');
const rateLimit = require('express-rate-limit');
const path = require('path');

const PORT = process.env.PORT || 3001;
const NODE_ENV = process.env.NODE_ENV || 'development';
const SESSION_SECRET = process.env.SESSION_SECRET || 'dev-secret-secure-shop';

if (!process.env.SESSION_SECRET) {
  console.warn('[WARNING] SESSION_SECRET non défini. Utilisation d\'une clé de développement par défaut. Ne pas utiliser en production.');
}

const authRoutes = require('./routes/auth');
const shopRoutes = require('./routes/shop');
const adminRoutes = require('./routes/admin');
const { injectUser } = require('./middleware/auth');

const app = express();

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "https://cdn.jsdelivr.net"],
      styleSrc: ["'self'", "https://cdn.jsdelivr.net", "https://fonts.googleapis.com", "'unsafe-inline'"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:"],
      connectSrc: ["'self'"],
      frameAncestors: ["'none'"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Trop de requêtes. Réessayez dans 15 minutes.'
});
app.use(globalLimiter);

app.use(morgan('combined'));

app.use(express.urlencoded({ extended: false, limit: '10kb' }));
app.use(express.json({ limit: '10kb' }));

app.use(express.static(path.join(__dirname, 'public')));


app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));


app.use(session({
  name: 'secureshop.sid',        // Nom personnalisé (pas 'connect.sid' par défaut)
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,              // Inaccessible via JavaScript (anti-XSS)
    secure: NODE_ENV === 'production',  // HTTPS only en prod
    sameSite: 'strict',          // Anti-CSRF supplémentaire
    maxAge: 2 * 60 * 60 * 1000  // 2 heures
  }
}));

app.use(flash());

app.use(csrf());

app.use((req, res, next) => {
  res.locals.csrfToken = req.csrfToken();
  next();
});

app.use((err, req, res, next) => {
  if (err.code === 'EBADCSRFTOKEN') {
    console.warn('[SECURITY] Token CSRF invalide :', req.ip, req.path);
    return res.status(403).render('error', {
      code: 403,
      message: 'Formulaire invalide ou expiré. Rechargez la page et réessayez.',
      user: req.session.username || null
    });
  }
  next(err);
});

app.use(injectUser);

app.get('/', (req, res) => res.redirect('/shop'));
app.use('/auth', authRoutes);
app.use('/shop', shopRoutes);
app.use('/admin', adminRoutes);

app.use((req, res) => {
  res.status(404).render('error', {
    title: 'Erreur 404',
    code: 404,
    message: 'Page introuvable.',
    user: req.session.username || null
  });
});

app.use((err, req, res, next) => {
  if (err.code === 'EBADCSRFTOKEN') {
    return res.status(403).render('error', {
      title: 'Erreur 403',
      code: 403,
      message: 'Requête invalide (CSRF).',
      user: req.session.username || null
    });
  }
  console.error('[ERROR]', err);
  res.status(500).render('error', {
    title: 'Erreur 500',
    code: 500,
    message: 'Erreur interne du serveur.',
    user: req.session.username || null
  });
});

app.listen(PORT, () => {
  console.log(`\n🔐 SecureShop démarré sur http://localhost:${PORT}`);
  console.log(`   Environnement : ${NODE_ENV}`);
  console.log(`   Admin         : /admin`);
  console.log(`   Boutique      : /shop\n`);
});

module.exports = app;
