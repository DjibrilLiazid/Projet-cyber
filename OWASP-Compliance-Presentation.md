# SecureShop — Présentation de conformité OWASP

## 1. Contexte du projet

SecureShop est une boutique en ligne développée avec Node.js, Express, EJS et SQLite.
Le projet répond aux exigences de l'UE B2 – Dev, Introduction à la cybersécurité 2025-2026.

### Objectif

Proposer une application fonctionnelle et sécurisée, couvrant :

- authentification
- gestion des utilisateurs
- accès protégés
- formulaires sécurisés
- don­nées sensibles
- actions utilisateur
- espace administrateur

---

## 2. Fonctionnalités implémentées

### Authentification

- Inscription et connexion utilisateurs via `routes/auth.js`.
- Gestion des mots de passe sécurisée avec `bcrypt`.
- Session utilisateur stockée côté serveur.

### Gestion des utilisateurs

- Page admin de gestion des utilisateurs dans `routes/admin.js`.
- Activation / désactivation des comptes utilisateurs.
- Protection des comptes administrateur.

### Accès protégés

- Middleware `middleware/auth.js` : `requireAuth` et `requireAdmin`.
- Routes `/shop/cart`, `/shop/checkout`, `/shop/orders` réservées aux utilisateurs.
- Tout l’espace `/admin` est réservé aux admins.

### Formulaires

- CSRF global via `csurf` dans `app.js`.
- Toutes les vues POST ont `_csrf` dans les formulaires.
- Validation d’entrée avec `express-validator`.

### Données sensibles

- Mots de passe hachés avec `bcrypt`.
- Secret de session stocké dans `.env`.
- Cookies `httpOnly` et `sameSite: 'strict'`.

### Actions utilisateur

- Ajout / suppression d’articles du panier.
- Passage de commande et historique de commandes.
- Administration produits et commandes.

### Espace administrateur

- Dashboard administrateur avec statistiques.
- Gestion des produits (`admin/products.ejs`).
- Visualisation de toutes les commandes (`admin/orders.ejs`).

---

## 3. Conformité OWASP Top 10 demandée

### A01 — Broken Access Control

Risques

- Accès aux données ou fonctionnalités sans autorisation.

Protection

- `requireAuth` protège les pages utilisateur.
- `requireAdmin` protège l’espace admin.
- Contrôle d’accès côté serveur dans `middleware/auth.js`.

Code

- `routes/admin.js`
- `middleware/auth.js`

### A03 — Injection

Risques

- Injection SQL via saisie utilisateur.

Protection

- Requêtes SQL préparées avec paramètres `?`.
- Pas de concaténation dynamique de SQL.

Code

- `config/db.js`
- `routes/shop.js`
- `routes/auth.js`
- `routes/admin.js`

### A05 — Security Misconfiguration

Risques

- Mauvaises en-têtes HTTP ou paramètres exposés.

Protection

- `helmet()` activé dans `app.js`.
- CSP limitée aux ressources nécessaires.
- HSTS configuré en production.
- Limite de taille des requêtes.

Code

- `app.js`

### A02 — Cryptographic Failures

Risques

- Mots de passe ou secrets non protégés.

Protection

- `bcrypt` pour le hachage des mots de passe.
- `SESSION_SECRET` dans `.env`.
- Session régénérée à la connexion.
- Cookies sécurisés côté client.

Code

- `routes/auth.js`
- `app.js`

### A07 — Authentication Failures

Risques

- Bruteforce ou tentatives de connexion répétées.

Protection

- Limiteur de connexion `express-rate-limit`.
- Verrouillage du compte après 5 échecs.
- Messages d’erreur génériques.

Code

- `routes/auth.js`

---

## 4. Autres catégories OWASP couvertes

### A04 — Insecure Design

- Application conçue avec séparation des rôles et validation serveur.

### A06 — Vulnerable and Outdated Components

- Dépendances gérées via `package.json`.
- `npm audit` recommandé pour la maintenance.

### A09 — Security Logging and Monitoring

- Logs de base avec `morgan` et erreurs console.
- À améliorer pour une solution de monitoring complète.

### A10 — Server-Side Request Forgery

- L’app n’effectue pas de requêtes externes côté serveur.

---

## 5. Preuves de code et références

### Authentification

- `routes/auth.js`
- `views/auth/login.ejs`
- `views/auth/register.ejs`

### Gestion des utilisateurs / Admin

- `routes/admin.js`
- `views/admin/users.ejs`
- `views/admin/products.ejs`
- `views/admin/orders.ejs`

### Accès protégés

- `middleware/auth.js`
- `app.js` (routes et protection)

### Formulaires et CSRF

- `app.js` (`csurf` global)
- `views/partials/header.ejs` (logout)
- `views/shop/cart.ejs`, `views/shop/product.ejs`

### Données sensibles

- `config/db.js` (SQLite wrapper)
- `routes/auth.js` (`bcrypt`, session)

---

## 6. Organisation du projet

Le projet est structuré de manière claire :

- `app.js` : configuration générale
- `routes/` : gestion des routes fonctionnelles
- `middleware/` : protections d’accès
- `config/` : connexion à la base
- `views/` : templates EJS
- `public/` : ressources statiques
- `db/schema.sql` : schéma et données initiales

---

## 7. Notes de fonctionnement

### Lancement

```bash
cd "c:\Users\Micosa\Documents\Ynov\Intro cyber\Projet-cyber"
npm install
npm start
```

### Accès

- `http://localhost:3001/shop`
- `http://localhost:3001/auth/login`

### Comptes de démonstration

- Admin : `admin@secureshop.fr` / `Admin1234!`
- User : `alice@example.fr` / `User1234!`

---

## 8. Conclusion

SecureShop couvre les fonctionnalités exigées par le sujet et met en œuvre des protections pour les principaux points OWASP vus en cours.
Le code est fonctionnel, exécutable et organisé pour montrer clairement la sécurisation.
Pour aller plus loin, il est possible d’ajouter la vérification email, la réinitialisation de mot de passe et un log de sécurité plus robuste.
