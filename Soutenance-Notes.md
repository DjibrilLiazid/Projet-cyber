# Notes de soutenance — SecureShop

## 1. Introduction (1-2 minutes)

- Présente rapidement le projet : SecureShop, une boutique en ligne développée avec Node.js, Express, EJS et SQLite.
- Objectif : démontrer une application fonctionnelle avec des protections issues du OWASP Top 10.
- Indique les fonctionnalités principales : authentification, panier, espace utilisateur, espace admin, gestion produits, commandes.

## 2. Démonstration des fonctionnalités principales (6-8 minutes)

### 2.1 Accueil et navigation

- Montre la page catalogue `/shop`.
- Explique que l’utilisateur peut filtrer les produits par catégorie.

### 2.2 Authentification

- Montre la page de connexion `/auth/login`.
- Explique la création de compte `/auth/register`.
- Indique que les mots de passe sont hachés avec `bcrypt`.

### 2.3 Fonctionnalités utilisateur

- Connecte-toi en tant qu’utilisateur de démonstration (`alice@example.fr`).
- Montre l’ajout d’un produit au panier et l’accès à `/shop/cart`.
- Présente le passage de commande `/shop/checkout` et les commandes `/shop/orders`.

### 2.4 Espace administrateur

- Connecte-toi en tant qu’admin (`admin@secureshop.fr`).
- Montre le tableau de bord `/admin`.
- Montre la gestion des produits `/admin/products` et des utilisateurs `/admin/users`.
- Explique l’accès protégé du back-office.

## 3. Sécurité et protections OWASP (6-8 minutes)

### 3.1 Broken Access Control

- Explique que l’accès aux pages utilisateurs et admin est vérifié côté serveur.
- Cite `middleware/auth.js` et `routes/admin.js`.
- Exemple : un utilisateur normal ne peut pas accéder à `/admin`.

### 3.2 Injection

- Explique que toutes les requêtes SQL utilisent des paramètres `?`.
- Montre `config/db.js` et un exemple dans `routes/shop.js` ou `routes/auth.js`.
- Indique que cela protège des injections SQL.

### 3.3 Security Misconfiguration

- Montre `app.js` avec `helmet()`.
- Explique la politique CSP, HSTS et les limites de taille des requêtes.
- Indique pourquoi ces protections réduisent les risques liés à la configuration.

### 3.4 Cryptographic Failures

- Explique l’usage de `bcrypt` pour le hachage des mots de passe.
- Parle de `SESSION_SECRET` dans `.env` et du cookie `httpOnly` et `sameSite`.

### 3.5 Authentication Failures

- Explique le rate limiting sur `/auth/login`.
- Montre la logique de verrouillage de compte après plusieurs échecs dans `routes/auth.js`.
- Parle de la régénération de session à la connexion.

## 4. Code à montrer pendant la soutenance

- `app.js` : configuration générale, sécurité HTTP, sessions, CSRF.
- `middleware/auth.js` : contrôle d’accès et injection de données utilisateur.
- `routes/auth.js` : login, register, protections de compte.
- `routes/shop.js` : panier, checkout, validation des entrées.
- `routes/admin.js` : espace admin et gestion des ressources.
- `config/db.js` : wrapper SQLite et utilisation sécurisée des requêtes.

## 5. Conclusion / points à retenir

- SecureShop est fonctionnel et exécutable.
- Le projet est organisé en routes, middleware, vues et configuration.
- Les protections principales du OWASP Top 10 sont présentes et démontrables.
- Pour aller plus loin : vérification d’email, réinitialisation de mot de passe, journalisation avancée, HTTPS en production.

## 6. Plan de déroulement recommandé (15-20 minutes)

1. Présentation du projet et des objectifs (2 min)
2. Démonstration rapide des fonctionnalités (6-8 min)
3. Explication des protections OWASP principales (6-8 min)
4. Conclusion et réponses aux questions (2-4 min)
