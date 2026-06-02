
const express = require('express');
const { body, param, validationResult } = require('express-validator');
const db = require('../config/db');
const { requireAuth } = require('../middleware/auth');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const category = req.query.category || null;
    let query = 'SELECT * FROM products WHERE is_active = 1';
    let params = [];

    if (category) {
      // Paramètre préparé — jamais de concaténation dans la requête
      query += ' AND category = ?';
      params.push(category);
    }
    query += ' ORDER BY created_at DESC';

    const [products] = await db.execute(query, params);
    const [categories] = await db.execute(
      'SELECT DISTINCT category FROM products WHERE is_active = 1'
    );

    // Nombre d'articles dans le panier (affiché dans la navbar)
    let cartCount = 0;
    if (req.session.userId) {
      const [[row]] = await db.execute(
        'SELECT COALESCE(SUM(quantity), 0) as total FROM cart_items WHERE user_id = ?',
        [req.session.userId]
      );
      cartCount = row.total || 0;
    }

    res.render('shop/index', {
      title: 'Boutique',
      products,
      categories: categories.map(c => c.category),
      currentCategory: category,
      cartCount
    });
  } catch (err) {
    console.error('[SHOP] Erreur catalogue :', err);
    res.status(500).render('error', { title: 'Erreur 500', code: 500, message: 'Erreur serveur', user: req.session.username });
  }
});

router.get('/product/:id', [
  param('id').isInt({ min: 1 }).withMessage('ID invalide'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).render('error', { title: 'Erreur 400', code: 400, message: 'Produit introuvable', user: req.session.username });

  try {
    const [rows] = await db.execute(
      'SELECT * FROM products WHERE id = ? AND is_active = 1',
      [req.params.id]
    );
    if (!rows.length) return res.status(404).render('error', { title: 'Erreur 404', code: 404, message: 'Produit introuvable', user: req.session.username });

    res.render('shop/product', {
      title: rows[0].name,
      product: rows[0],
      csrfToken: req.session.userId ? req.csrfToken() : null
    });
  } catch (err) {
    console.error('[SHOP] Erreur produit :', err);
    res.status(500).render('error', { title: 'Erreur 500', code: 500, message: 'Erreur serveur', user: req.session.username });
  }
});

router.get('/cart', requireAuth, async (req, res) => {
  try {

    const [items] = await db.execute(`
      SELECT ci.id, ci.quantity, p.id as product_id, p.name, p.price, p.image_url
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.id
      WHERE ci.user_id = ?
      ORDER BY ci.added_at DESC
    `, [req.session.userId]);

    const total = items.reduce((sum, i) => sum + (i.price * i.quantity), 0);

    res.render('shop/cart', {
      title: 'Mon Panier',
      items,
      total: total.toFixed(2),
      csrfToken: req.csrfToken()
    });
  } catch (err) {
    console.error('[SHOP] Erreur panier :', err);
    res.status(500).render('error', { title: 'Erreur 500', code: 500, message: 'Erreur serveur', user: req.session.username });
  }
});

router.post('/cart/add', requireAuth, [
  body('product_id').isInt({ min: 1 }).withMessage('Produit invalide'),
  body('quantity').isInt({ min: 1, max: 99 }).withMessage('Quantité invalide'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    req.flash('error', 'Données invalides.');
    return res.redirect('/shop');
  }

  const productId = parseInt(req.body.product_id, 10);
  const quantity = parseInt(req.body.quantity, 10);

  try {
    const [prodRows] = await db.execute(
      'SELECT id, stock FROM products WHERE id = ? AND is_active = 1',
      [productId]
    );
    if (!prodRows.length) {
      req.flash('error', 'Produit introuvable.');
      return res.redirect('/shop');
    }

    const product = prodRows[0];
    const [cartRows] = await db.execute(
      'SELECT quantity FROM cart_items WHERE user_id = ? AND product_id = ?',
      [req.session.userId, productId]
    );
    const existingQuantity = cartRows.length ? cartRows[0].quantity : 0;

    if (existingQuantity + quantity > product.stock) {
      req.flash('error', `Stock insuffisant. Il ne reste que ${product.stock - existingQuantity} article(s) disponible(s).`);
      return res.redirect('/shop/product/' + productId);
    }

    await db.execute(`
      INSERT INTO cart_items (user_id, product_id, quantity)
      VALUES (?, ?, ?)
      ON CONFLICT(user_id, product_id) DO UPDATE SET quantity = cart_items.quantity + excluded.quantity
    `, [req.session.userId, productId, quantity]);

    req.flash('success', 'Article ajouté au panier !');
    res.redirect('/shop/cart');
  } catch (err) {
    console.error('[SHOP] Erreur ajout panier :', err);
    res.status(500).render('error', { title: 'Erreur 500', code: 500, message: 'Erreur serveur', user: req.session.username });
  }
});

router.post('/cart/remove', requireAuth, [
  body('item_id').isInt({ min: 1 }),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.redirect('/shop/cart');

  try {

    await db.execute(
      'DELETE FROM cart_items WHERE id = ? AND user_id = ?',
      [req.body.item_id, req.session.userId]
    );
    req.flash('success', 'Article retiré du panier.');
    res.redirect('/shop/cart');
  } catch (err) {
    console.error('[SHOP] Erreur suppression panier :', err);
    res.redirect('/shop/cart');
  }
});

router.post('/checkout', requireAuth, async (req, res) => {
  try {
    const [items] = await db.execute(`
      SELECT ci.quantity, p.price, p.id as product_id, p.stock
      FROM cart_items ci JOIN products p ON ci.product_id = p.id
      WHERE ci.user_id = ?
    `, [req.session.userId]);

    if (!items.length) {
      req.flash('error', 'Votre panier est vide.');
      return res.redirect('/shop/cart');
    }

    const outOfStock = items.filter(item => item.quantity > item.stock);
    if (outOfStock.length) {
      const productNames = outOfStock.map(i => i.product_id).join(', ');
      req.flash('error', 'Stock insuffisant sur certains articles. Veuillez vérifier votre panier.');
      return res.redirect('/shop/cart');
    }

    const total = items.reduce((sum, i) => sum + (i.price * i.quantity), 0);

    const conn = await require('../config/db').getConnection();
    await conn.beginTransaction();
    try {
      const [orderResult] = await conn.execute(
        'INSERT INTO orders (user_id, total, status) VALUES (?, ?, "paid")',
        [req.session.userId, total.toFixed(2)]
      );
      const orderId = orderResult.insertId;

      for (const item of items) {
        const [updateResult] = await conn.execute(
          'UPDATE products SET stock = stock - ? WHERE id = ? AND stock >= ?',
          [item.quantity, item.product_id, item.quantity]
        );
        if (updateResult.affectedRows === 0) {
          throw new Error(`Stock insuffisant pour le produit ${item.product_id}`);
        }

        await conn.execute(
          'INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES (?, ?, ?, ?)',
          [orderId, item.product_id, item.quantity, item.price]
        );
      }

      await conn.execute('DELETE FROM cart_items WHERE user_id = ?', [req.session.userId]);
      await conn.commit();
      conn.release();

      req.flash('success', `Commande #${orderId} confirmée ! Merci pour votre achat.`);
      res.redirect('/shop/orders');
    } catch (err) {
      await conn.rollback();
      conn.release();
      throw err;
    }
  } catch (err) {
    console.error('[SHOP] Erreur checkout :', err);
    req.flash('error', 'Erreur lors de la commande. Veuillez réessayer.');
    res.redirect('/shop/cart');
  }
});

router.get('/orders', requireAuth, async (req, res) => {
  try {
    // L'utilisateur ne voit QUE ses propres commandes
    const [orders] = await db.execute(
      'SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC',
      [req.session.userId]
    );
    res.render('shop/orders', { title: 'Mes Commandes', orders });
  } catch (err) {
    console.error('[SHOP] Erreur commandes :', err);
    res.status(500).render('error', { title: 'Erreur 500', code: 500, message: 'Erreur serveur', user: req.session.username });
  }
});

module.exports = router;
