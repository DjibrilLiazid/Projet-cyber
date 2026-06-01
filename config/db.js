// config/db.js
// SQLite via le package "sqlite3" — callback-based avec wrapper Promise
// Aucune configuration requise, le fichier .db est créé automatiquement

const sqlite3 = require('sqlite3').verbose();
const path    = require('path');
const fs      = require('fs');

const DB_PATH = path.join(__dirname, '..', 'secureshop.db');
const db      = new sqlite3.Database(DB_PATH, (err) => {
  if (err) { console.error('[DB] ❌ Erreur SQLite :', err.message); process.exit(1); }
  console.log('[DB] ✅ SQLite connecté :', DB_PATH);
});

db.run('PRAGMA foreign_keys = ON');
db.run('PRAGMA journal_mode = WAL');

// Initialisation du schéma au premier lancement
const schemaPath = path.join(__dirname, '..', 'db', 'schema.sql');
const schema = fs.readFileSync(schemaPath, 'utf8');
const statements = schema.split(';').map(s => s.trim()).filter(s => s.length > 0);
statements.forEach(stmt => {
  db.run(stmt, err => {
    if (err && !err.message.includes('already exists') && !err.message.includes('UNIQUE')) {
      // Silently ignore seed duplicates
    }
  });
});

// ── Adaptateur Promise compatible avec l'API mysql2 ──────────────────────────
// Toutes les routes utilisent : await db.execute('SELECT ...', [params])
// qui retourne [rows] pour SELECT, ou [{ insertId, affectedRows }] pour INSERT/UPDATE/DELETE

const pool = {
  execute(sql, params = []) {
    return new Promise((resolve, reject) => {
      const trimmed = sql.trim().toUpperCase();
      if (trimmed.startsWith('SELECT') || trimmed.startsWith('PRAGMA')) {
        db.all(sql, params, (err, rows) => {
          if (err) return reject(err);
          resolve([rows]);
        });
      } else if (trimmed.startsWith('INSERT')) {
        db.run(sql, params, function(err) {
          if (err) return reject(err);
          resolve([{ insertId: this.lastID, affectedRows: this.changes }]);
        });
      } else {
        db.run(sql, params, function(err) {
          if (err) return reject(err);
          resolve([{ insertId: this.lastID, affectedRows: this.changes }]);
        });
      }
    });
  },

  // Transactions pour le checkout
  getConnection() {
    return new Promise((resolve) => {
      const conn = {
        execute: pool.execute.bind(pool),
        beginTransaction: () => new Promise((res, rej) => db.run('BEGIN', err => err ? rej(err) : res())),
        commit:           () => new Promise((res, rej) => db.run('COMMIT', err => err ? rej(err) : res())),
        rollback:         () => new Promise((res, rej) => db.run('ROLLBACK', err => err ? rej(err) : res())),
        release:          () => Promise.resolve(),
      };
      resolve(conn);
    });
  }
};

module.exports = pool;
