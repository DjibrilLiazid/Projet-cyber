# Change Report

## Overview

This report summarizes the updates made to the SecureShop project to ensure it is functional, secure, and easier to run after cloning.

## Key changes

### 1. Default environment handling

- Updated `app.js` to provide default values when `.env` is missing.
- Added `PORT`, `NODE_ENV`, and `SESSION_SECRET` default values.
- Added a warning if `SESSION_SECRET` is not defined, while still allowing the app to run in development.

### 2. Authentication seed and default users

- Updated `config/db.js` to ensure default user accounts are created or refreshed automatically at startup.
- Added default login credentials seeded in the app:
  - `admin@secureshop.fr` / `Admin1234!`
  - `alice@example.fr` / `User1234!`
- Updated `db/schema.sql` with working bcrypt password hashes for the default admin and user accounts.

### 3. Fixed cart rendering bug

- Corrected `views/shop/cart.ejs` to use index-based loop separation instead of the invalid `loop.last` logic.

### 4. Improved cart and checkout validation

- Updated `routes/shop.js` to verify stock before adding items to the cart.
- Added protection against adding more quantity than available.
- Improved checkout logic to verify stock again, decrement product stock safely, and complete the order transactionally.

### 5. OWASP compliance documentation

- Added `OWASP-Compliance-Presentation.md` summarizing the app's security features and OWASP Top 10 coverage.
- Updated the presentation content to align with the project’s goals and grading criteria.

### 6. Oral defense notes

- Added `Soutenance-Notes.md` to provide a guided oral presentation script for a 15-20 minute defense.
- Included recommended demonstration flow, code references, and OWASP explanations.

## Result

- The app is now executable after cloning without requiring manual `.env` setup in development.
- Authentication and default user accounts work on first startup.
- The checkout process and cart display are more robust and secure.
- Documentation has been added to support both the written report and oral defense.

## Files changed

- `app.js`
- `config/db.js`
- `db/schema.sql`
- `views/shop/cart.ejs`
- `routes/shop.js`
- `OWASP-Compliance-Presentation.md`
- `Soutenance-Notes.md`
- `Change-Report.md`
