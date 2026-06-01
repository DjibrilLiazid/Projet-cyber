# Script de présentation orale — SecureShop

## 1. Introduction

Bonjour, je présente SecureShop, une boutique en ligne développée avec Node.js, Express, EJS et SQLite.

Le but du projet est de démontrer une application fonctionnelle et sécurisée pour le cours Introduction à la cybersécurité B2 – Dev 2025-2026.

Je vais expliquer les fonctionnalités principales, montrer le code important et détailler les protections mises en place pour le OWASP Top 10.

---

## 2. Fonctionnalités principales

### 2.1 Authentification

- L’utilisateur peut se créer un compte et se connecter.
- Les mots de passe sont hachés avec `bcrypt` dans `routes/auth.js`.
- La session est gérée côté serveur avec `express-session`.
- Je montre la page `/auth/login` et la page `/auth/register`.

### 2.2 Gestion des utilisateurs

- Le compte admin existe et permet d’accéder à un espace protégé.
- Dans l’admin, on peut voir la liste des utilisateurs et désactiver les comptes.
- La gestion des utilisateurs se trouve dans `routes/admin.js`.

### 2.3 Accès protégés

- Les pages `/shop/cart`, `/shop/orders` et `/admin/*` sont protégées.
- Le middleware `middleware/auth.js` vérifie si l’utilisateur est connecté et s’il est admin.
- Je montre comment `requireAuth` bloque l’accès aux pages privées.

### 2.4 Panier et commandes

- L’utilisateur peut ajouter des produits au panier, supprimer un article et passer commande.
- Pendant le checkout, le stock est vérifié et mis à jour dans `routes/shop.js`.
- Je montre le processus depuis `/shop` jusqu’à `/shop/checkout`.

### 2.5 Espace administrateur

- L’admin a un dashboard avec statistiques, gestion de produits et commandes.
- Je montre `/admin`, `/admin/products` et `/admin/orders`.
- L’espace admin ne s’ouvre que si l’utilisateur a le rôle `admin`.

---

## 3. Protection OWASP

Je présente cinq catégories OWASP prioritaires suivies d’autres protections.

### 3.1 Broken Access Control

- Risque : un utilisateur peut accéder à une page interdite.
- Protection : `middleware/auth.js` vérifie `req.session.userId` et `req.session.role`.
- Code : `routes/admin.js` et `app.js`.
- Exemple : un utilisateur normal qui tente `/admin` reçoit une erreur 403.

### 3.2 Injection

- Risque : les données utilisateur modifient une requête SQL.
- Protection : toutes les requêtes SQL utilisent des paramètres `?`.
- Code : `config/db.js` et les routes `routes/auth.js`, `routes/shop.js`, `routes/admin.js`.
- Exemple : `db.execute('SELECT * FROM users WHERE email = ?', [email])`.

### 3.3 Security Misconfiguration

- Risque : paramètres HTTP ou serveurs mal configurés.
- Protection : `helmet()` dans `app.js` pour CSP, X-Frame-Options, HSTS.
- Cookie sécurisé avec `httpOnly` et `sameSite: 'strict'`.
- Limite de taille de requête et static files bien servis.

### 3.4 Cryptographic Failures

- Risque : mots de passe ou secrets mal protégés.
- Protection : `bcrypt` pour le hachage des mots de passe.
- `SESSION_SECRET` est utilisé pour signer la session.
- Code : `routes/auth.js` et `app.js`.

### 3.5 Authentication Failures

- Risque : brute force ou vol de session.
- Protection : rate limiting sur `/auth/login`.
- Verrouillage du compte après 5 échecs.
- Session régénérée après connexion.

### 3.6 Autres protections

- CSRF : `csurf` avec token inclus dans tous les formulaires.
- Validation des données avec `express-validator`.
- Cartes et commandes protégées par ID utilisateur.
- Pas d’exécution de code externe côté serveur.

---

## 4. Codes à montrer

Pendant la soutenance, je montre :

- `app.js` : configuration, Helmet, sessions, CSRF.
- `middleware/auth.js` : contrôles d’accès.
- `routes/auth.js` : login, registration, sécurisation de la connexion.
- `routes/shop.js` : ajout au panier, checkout, vérifications de stock.
- `routes/admin.js` : espace admin et gestion.
- `config/db.js` : connexion SQLite et requêtes sécurisées.

---

## 5. Résumé et conclusion

SecureShop est fonctionnel et organise le code proprement.

Il couvre les protections OWASP essentielles : accès, injection, configuration, cryptographie et authentification.

Pour aller plus loin, il faudrait ajouter la vérification d’email, la réinitialisation de mot de passe et une vraie journalisation de sécurité.

Merci.
