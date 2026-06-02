
const express = require('express');
const bcrypt = require('bcrypt');
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const db = require('../config/db');
const router = express.Router();

const BCRYPT_ROUNDS = 12; // Coût suffisamment élevé pour ralentir le brute-force

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: 'Trop de tentatives de connexion. Réessayez dans 15 minutes.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    req.flash('error', 'Trop de tentatives. Compte temporairement bloqué (15 min).');
    res.redirect('/auth/login');
  }
});

router.get('/login', (req, res) => {
  if (req.session.userId) return res.redirect('/shop');
  res.render('auth/login', { title: 'Connexion', csrfToken: req.csrfToken() });
});

router.post('/login', loginLimiter, [
  body('email').isEmail().normalizeEmail().withMessage('Email invalide'),
  body('password').notEmpty().withMessage('Mot de passe requis'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    req.flash('error', errors.array()[0].msg);
    return res.redirect('/auth/login');
  }

  const { email, password } = req.body;

  try {
    const [rows] = await db.execute(
      'SELECT * FROM users WHERE email = ? AND is_active = 1 LIMIT 1',
      [email]
    );

    const user = rows[0];

    // Vérification du verrouillage de compte
    if (user && user.locked_until && new Date() < new Date(user.locked_until)) {
      req.flash('error', 'Compte temporairement verrouillé. Réessayez plus tard.');
      return res.redirect('/auth/login');
    }

    // Comparaison bcrypt 
    const validPassword = user ? await bcrypt.compare(password, user.password_hash) : false;

    if (!user || !validPassword) {
      // Incrémenter les échecs et verrouiller après 5 tentatives
      if (user) {
        const newAttempts = user.failed_login_attempts + 1;
        const lockUntil = newAttempts >= 5
          ? new Date(Date.now() + 15 * 60 * 1000)
          : null;
        await db.execute(
          'UPDATE users SET failed_login_attempts = ?, locked_until = ? WHERE id = ?',
          [newAttempts, lockUntil, user.id]
        );
      }
      req.flash('error', 'Email ou mot de passe incorrect.');
      return res.redirect('/auth/login');
    }

    // Reset des compteurs d'échec
    await db.execute(
      'UPDATE users SET failed_login_attempts = 0, locked_until = NULL WHERE id = ?',
      [user.id]
    );

    // Regénération de l'ID de session — protection contre la fixation de session
    req.session.regenerate((err) => {
      if (err) throw err;
      req.session.userId = user.id;
      req.session.username = user.username;
      req.session.role = user.role;
      req.flash('success', `Bienvenue, ${user.username} !`);
      res.redirect(user.role === 'admin' ? '/admin' : '/shop');
    });

  } catch (err) {
    console.error('[AUTH] Erreur login :', err);
    req.flash('error', 'Une erreur est survenue. Réessayez.');
    res.redirect('/auth/login');
  }
});

router.get('/register', (req, res) => {
  if (req.session.userId) return res.redirect('/shop');
  res.render('auth/register', { title: 'Créer un compte', csrfToken: req.csrfToken() });
});

router.post('/register', [
  body('username')
    .trim()
    .isLength({ min: 3, max: 50 }).withMessage('Pseudo : 3 à 50 caractères')
    .matches(/^[a-zA-Z0-9_]+$/).withMessage('Pseudo : lettres, chiffres et _ uniquement'),
  body('email')
    .isEmail().normalizeEmail().withMessage('Email invalide'),
  body('password')
    .isLength({ min: 8 }).withMessage('Mot de passe : minimum 8 caractères')
    .matches(/[A-Z]/).withMessage('Mot de passe : au moins une majuscule')
    .matches(/[0-9]/).withMessage('Mot de passe : au moins un chiffre')
    .matches(/[^a-zA-Z0-9]/).withMessage('Mot de passe : au moins un caractère spécial'),
  body('confirmPassword').custom((val, { req }) => {
    if (val !== req.body.password) throw new Error('Les mots de passe ne correspondent pas');
    return true;
  }),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    req.flash('error', errors.array().map(e => e.msg).join(' | '));
    return res.redirect('/auth/register');
  }

  const { username, email, password } = req.body;

  try {
    // Vérifier l'unicité
    const [existing] = await db.execute(
      'SELECT id FROM users WHERE email = ? OR username = ?',
      [email, username]
    );
    if (existing.length > 0) {
      req.flash('error', 'Cet email ou ce pseudo est déjà utilisé.');
      return res.redirect('/auth/register');
    }

    // Hachage bcrypt avec saltRounds élevé
    const hash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    await db.execute(
      'INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, "user")',
      [username, email, hash]
    );

    req.flash('success', 'Compte créé ! Vous pouvez maintenant vous connecter.');
    res.redirect('/auth/login');

  } catch (err) {
    console.error('[AUTH] Erreur register :', err);
    req.flash('error', 'Erreur lors de la création du compte.');
    res.redirect('/auth/register');
  }
});

// ── POST /auth/logout ────────────────────────────
router.post('/logout', (req, res) => {
  // Destruction complète de la session
  req.session.destroy((err) => {
    if (err) console.error('[AUTH] Erreur logout :', err);
    res.clearCookie('secureshop.sid');
    res.redirect('/auth/login');
  });
});

module.exports = router;
