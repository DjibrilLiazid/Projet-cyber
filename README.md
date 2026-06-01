# 🔐 SecureShop — Projet OWASP B2 Ynov 2025-2026

Boutique en ligne sécurisée développée avec Node.js / Express / MySQL.

## ⚡ Installation rapide

### 1. Prérequis
- Node.js 18+
- MySQL 8+ (ou MariaDB 10.6+)

### 2. Cloner et installer
```bash
npm install
```

### 3. Configurer l'environnement
```bash
cp .env.example .env
# Éditer .env avec vos identifiants MySQL
```

### 4. Créer la base de données
```bash
mysql -u root -p < db/schema.sql
```

### 5. Lancer l'application
```bash
npm start
# → http://localhost:3000
```

## 👤 Comptes de démonstration

| Rôle  | Email                 | Mot de passe |
|-------|-----------------------|--------------|
| Admin | admin@secureshop.fr   | Admin1234!   |
| User  | alice@example.fr      | User1234!    |

> ⚠️ Si les mots de passe ne fonctionnent pas (les hashes dans schema.sql sont des exemples),
> créez un compte via `/auth/register` et promouvez-le admin en BDD :
> `UPDATE users SET role = 'admin' WHERE email = 'votre@email.fr';`

---

## 🛡️ Sécurisations OWASP — Guide pour la soutenance

### A01 — Broken Access Control ✅
**Risque :** Un utilisateur accède à des ressources qui ne lui appartiennent pas.

**Protections :**
- Middleware `requireAuth` : vérifie `req.session.userId` avant chaque route protégée
- Middleware `requireAdmin` : vérifie `req.session.role === 'admin'` côté serveur
- Toutes les requêtes panier/commandes filtrent par `user_id = req.session.userId`
- Protection IDOR sur la suppression panier : `WHERE id = ? AND user_id = ?`

**Code clé :** `middleware/auth.js`, `routes/shop.js` (cart/remove)

---

### A02 — Cryptographic Failures ✅
**Risque :** Les mots de passe sont stockés en clair ou avec un algorithme faible (MD5, SHA1).

**Protections :**
- bcrypt avec `saltRounds = 12` pour tous les mots de passe
- Jamais de mot de passe en clair dans la BDD (colonne `password_hash`)
- Variables d'environnement pour les secrets (SESSION_SECRET dans `.env`)
- Session cookie `httpOnly: true` (inaccessible au JavaScript)

**Code clé :** `routes/auth.js` (bcrypt.hash / bcrypt.compare)

---

### A03 — Injection ✅
**Risque :** Un attaquant injecte du SQL ou du code malveillant via les formulaires.

**Protections (SQL) :**
- 100% des requêtes utilisent des paramètres préparés : `db.execute('SELECT * FROM users WHERE email = ?', [email])`
- Jamais de concaténation de chaîne dans les requêtes SQL

**Protections (XSS) :**
- EJS utilise `<%= %>` qui échappe automatiquement le HTML
- `<%- %>` est évité pour les données utilisateur
- Helmet configure le Content-Security-Policy

**Code clé :** Toutes les routes — `routes/auth.js`, `routes/shop.js`, `routes/admin.js`

---

### A04 — Insecure Design ✅
**Risque :** L'architecture ne prévoit pas la sécurité dès la conception.

**Protections :**
- Soft delete des produits (conservation des données historiques)
- Transactions MySQL pour le checkout (cohérence garantie)
- Séparation stricte des routes (auth / shop / admin)
- Validation des données à l'entrée (express-validator)

---

### A05 — Security Misconfiguration ✅
**Risque :** Le serveur expose des informations sensibles ou utilise des configs par défaut.

**Protections :**
- **Helmet.js** configure automatiquement les headers de sécurité :
  - `X-Frame-Options: DENY` (anti-clickjacking)
  - `X-Content-Type-Options: nosniff` (anti-MIME sniffing)
  - `Content-Security-Policy` (liste blanche des sources autorisées)
  - `Strict-Transport-Security` (HSTS)
- Nom de cookie personnalisé : `secureshop.sid` (pas `connect.sid`)
- Fichier `.env` exclu du dépôt (`.gitignore`)
- `NODE_ENV=production` active le cookie `secure: true`

**Code clé :** `app.js` (configuration helmet)

---

### A06 — Vulnerable and Outdated Components ✅
**Risque :** Dépendances avec des failles connues.

**Protections :**
- `npm audit` à lancer régulièrement
- Dépendances récentes et maintenues
- `package.json` avec versions fixes

---

### A07 — Authentication Failures ✅
**Risque :** Brute force, vol de session, comptes faibles.

**Protections :**
- **Rate limiting** : 10 tentatives max sur `/auth/login` par 15 min (express-rate-limit)
- **Verrouillage de compte** : après 5 échecs, compte bloqué 15 min
- **Regénération de session** après connexion : `req.session.regenerate()` (anti-fixation)
- **Session sécurisée** : `httpOnly`, `sameSite: strict`, expiration 2h
- **Validation des mots de passe** : 8 chars min, majuscule, chiffre, caractère spécial
- **Message d'erreur générique** : "Email ou mot de passe incorrect" (ne révèle pas si l'email existe)

**Code clé :** `routes/auth.js` (loginLimiter, regenerate, verrouillage)

---

### A08 — Software and Data Integrity Failures ✅
**Risque :** Données ou code modifiés sans détection.

**Protections :**
- Token **CSRF** sur tous les formulaires POST (csurf) : empêche les requêtes forgées
- Vérification serveur du token CSRF à chaque soumission de formulaire
- Validation stricte côté serveur (express-validator) — ne jamais faire confiance au client

**Code clé :** `app.js` (csrf middleware), tous les formulaires EJS (`_csrf`)

---

### A09 — Security Logging and Monitoring ✅
**Risque :** Les attaques ne sont pas détectées.

**Protections :**
- Morgan logge toutes les requêtes HTTP (`combined` format)
- Log des erreurs CSRF avec l'IP : `console.warn('[SECURITY] Token CSRF invalide :', req.ip)`
- Log des tentatives de connexion échouées
- Compteur de tentatives en BDD (`failed_login_attempts`)

**Code clé :** `app.js` (morgan), `routes/auth.js` (logs)

---

### A10 — Server-Side Request Forgery ✅
**Risque :** Le serveur effectue des requêtes vers des ressources internes.

**Protections :**
- Aucune fonctionnalité ne prend d'URL en entrée utilisateur
- CSP restrictive : seules les sources de confiance sont autorisées
- Pas de fetch/axios côté serveur basé sur des données utilisateur

---

## 🗂️ Structure du projet

```
secureshop/
├── app.js              # Point d'entrée, config sécurité (helmet, csrf, sessions)
├── config/
│   └── db.js           # Pool MySQL
├── middleware/
│   └── auth.js         # requireAuth, requireAdmin, injectUser
├── routes/
│   ├── auth.js         # Login, register, logout
│   ├── shop.js         # Catalogue, panier, commandes
│   └── admin.js        # Dashboard, users, produits
├── views/
│   ├── partials/       # Header, footer
│   ├── auth/           # Login, register
│   ├── shop/           # Catalogue, produit, panier, commandes
│   ├── admin/          # Dashboard, users, produits, commandes
│   └── error.ejs
├── public/css/         # Styles
├── db/schema.sql       # Schéma + données de test
└── .env.example        # Variables d'environnement
```
