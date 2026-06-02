
const sqlite3 = require('sqlite3').verbose();
const bcrypt  = require('bcrypt');
const path    = require('path');
const fs      = require('fs');

const DB_PATH = path.join(__dirname, '..', 'secureshop.db');
const db      = new sqlite3.Database(DB_PATH, (err) => {
  if (err) { console.error('[DB] ❌ Erreur SQLite :', err.message); process.exit(1); }
  console.log('[DB] ✅ SQLite connecté :', DB_PATH);
});

db.run('PRAGMA foreign_keys = ON');
db.run('PRAGMA journal_mode = WAL');

const dbGet = (sql, params = []) => new Promise((resolve, reject) => {
  db.get(sql, params, (err, row) => err ? reject(err) : resolve(row));
});

const dbRun = (sql, params = []) => new Promise((resolve, reject) => {
  db.run(sql, params, function(err) {
    if (err) return reject(err);
    resolve(this);
  });
});

async function ensureDefaultUsers() {
  const defaultUsers = [
    { username: 'admin', email: 'admin@secureshop.fr', password: 'Admin1234!', role: 'admin' },
    { username: 'alice', email: 'alice@example.fr', password: 'User1234!', role: 'user' }
  ];

  for (const user of defaultUsers) {
    const passwordHash = await bcrypt.hash(user.password, 12);
    const existing = await dbGet('SELECT id FROM users WHERE email = ?', [user.email]);

    if (existing) {
      await dbRun(
        'UPDATE users SET username = ?, password_hash = ?, role = ?, is_active = 1 WHERE email = ?',
        [user.username, passwordHash, user.role, user.email]
      );
    } else {
      await dbRun(
        'INSERT INTO users (username, email, password_hash, role, is_active) VALUES (?, ?, ?, ?, 1)',
        [user.username, user.email, passwordHash, user.role]
      );
    }
  }
}

// Initialisation du schéma au premier lancement
const schemaPath = path.join(__dirname, '..', 'db', 'schema.sql');
const schema = fs.readFileSync(schemaPath, 'utf8');
const statements = schema.split(';').map(s => s.trim()).filter(s => s.length > 0);

db.serialize(() => {
  statements.forEach(stmt => {
    db.run(stmt, err => {
      if (err && !err.message.includes('already exists') && !err.message.includes('UNIQUE')) {
        // Silently ignore seed duplicates
      }
    });
  });

  ensureDefaultUsers().catch(err => {
    console.error('[DB] Impossible de créer les utilisateurs par défaut :', err);
  });
});


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
