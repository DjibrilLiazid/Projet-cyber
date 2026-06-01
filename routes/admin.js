// routes/admin.js
// ================================================
// OWASP A01 - Broken Access Control
// Toutes les routes ici sont protégées par requireAdmin
// Seul un admin authentifié côté serveur peut y accéder
// ================================================

const express = require('express');
const { body, param, validationResult } = require('express-validator');
const db = require('../config/db');
const { requireAdmin } = require('../middleware/auth');
const router = express.Router();

// Toutes les routes admin nécessitent le rôle admin
// Le middleware est appliqué globalement sur ce router
router.use(requireAdmin);

// ── GET /admin — Dashboard ───────────────────────
router.get('/', async (req, res) => {
  try {
    const [[{ userCount }]]    = await db.execute('SELECT COUNT(*) as userCount FROM users');
    const [[{ productCount }]] = await db.execute('SELECT COUNT(*) as productCount FROM products');
    const [[{ orderCount }]]   = await db.execute('SELECT COUNT(*) as orderCount FROM orders');
    const [[{ revenue }]]      = await db.execute("SELECT COALESCE(SUM(total), 0) as revenue FROM orders WHERE status = 'paid'");
    const [recentOrders]       = await db.execute(
      'SELECT o.*, u.username FROM orders o JOIN users u ON o.user_id = u.id ORDER BY o.created_at DESC LIMIT 5'
    );

    res.render('admin/dashboard', {
      title: 'Administration',
      stats: { userCount, productCount, orderCount, revenue: (revenue || 0).toFixed(2) },
      recentOrders
    });
  } catch (err) {
    console.error('[ADMIN] Erreur dashboard :', err);
    res.status(500).render('error', { title: 'Erreur 500', code: 500, message: 'Erreur serveur', user: req.session.username });
  }
});

// ── GET /admin/users — Liste utilisateurs ────────
router.get('/users', async (req, res) => {
  try {
    const [users] = await db.execute(
      'SELECT id, username, email, role, is_active, failed_login_attempts, created_at FROM users ORDER BY created_at DESC'
    );
    res.render('admin/users', { title: 'Gestion Utilisateurs', users, csrfToken: req.csrfToken() });
  } catch (err) {
    console.error('[ADMIN] Erreur users :', err);
    res.status(500).render('error', { title: 'Erreur 500', code: 500, message: 'Erreur serveur', user: req.session.username });
  }
});

// ── POST /admin/users/:id/toggle — Activer/désactiver ──
router.post('/users/:id/toggle', [
  param('id').isInt({ min: 1 }),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.redirect('/admin/users');

  const userId = parseInt(req.params.id);

  // Un admin ne peut pas se désactiver lui-même
  if (userId === req.session.userId) {
    req.flash('error', 'Vous ne pouvez pas désactiver votre propre compte.');
    return res.redirect('/admin/users');
  }

  try {
    await db.execute(
      'UPDATE users SET is_active = CASE WHEN is_active = 1 THEN 0 ELSE 1 END WHERE id = ? AND role != "admin"',
      [userId]
    );
    req.flash('success', 'Statut utilisateur mis à jour.');
    res.redirect('/admin/users');
  } catch (err) {
    console.error('[ADMIN] Erreur toggle user :', err);
    res.redirect('/admin/users');
  }
});

// ── GET /admin/products — Liste produits ─────────
router.get('/products', async (req, res) => {
  try {
    const [products] = await db.execute('SELECT * FROM products ORDER BY created_at DESC');
    res.render('admin/products', { title: 'Gestion Produits', products, csrfToken: req.csrfToken() });
  } catch (err) {
    console.error('[ADMIN] Erreur produits :', err);
    res.status(500).render('error', { title: 'Erreur 500', code: 500, message: 'Erreur serveur', user: req.session.username });
  }
});

// ── POST /admin/products/add — Ajouter un produit ─
router.post('/products/add', [
  body('name').trim().isLength({ min: 2, max: 255 }).escape(),
  body('description').trim().isLength({ max: 2000 }).escape(),
  body('price').isFloat({ min: 0.01, max: 99999 }),
  body('stock').isInt({ min: 0 }),
  body('category').trim().isLength({ min: 1, max: 100 }).escape(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    req.flash('error', errors.array().map(e => e.msg).join(' | '));
    return res.redirect('/admin/products');
  }

  const { name, description, price, stock, category } = req.body;
  try {
    await db.execute(
      'INSERT INTO products (name, description, price, stock, category) VALUES (?, ?, ?, ?, ?)',
      [name, description, parseFloat(price), parseInt(stock), category]
    );
    req.flash('success', 'Produit ajouté avec succès.');
    res.redirect('/admin/products');
  } catch (err) {
    console.error('[ADMIN] Erreur ajout produit :', err);
    req.flash('error', 'Erreur lors de l\'ajout.');
    res.redirect('/admin/products');
  }
});

// ── POST /admin/products/:id/delete — Supprimer ──
router.post('/products/:id/delete', [
  param('id').isInt({ min: 1 }),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.redirect('/admin/products');

  try {
    // Soft delete — conservation des données pour les commandes existantes
    await db.execute('UPDATE products SET is_active = 0 WHERE id = ?', [req.params.id]);
    req.flash('success', 'Produit désactivé.');
    res.redirect('/admin/products');
  } catch (err) {
    console.error('[ADMIN] Erreur suppression produit :', err);
    res.redirect('/admin/products');
  }
});

// ── GET /admin/orders — Toutes les commandes ─────
router.get('/orders', async (req, res) => {
  try {
    const [orders] = await db.execute(`
      SELECT o.*, u.username, u.email
      FROM orders o JOIN users u ON o.user_id = u.id
      ORDER BY o.created_at DESC
    `);
    res.render('admin/orders', { title: 'Toutes les commandes', orders, csrfToken: req.csrfToken() });
  } catch (err) {
    console.error('[ADMIN] Erreur orders :', err);
    res.status(500).render('error', { title: 'Erreur 500', code: 500, message: 'Erreur serveur', user: req.session.username });
  }
});

module.exports = router;
