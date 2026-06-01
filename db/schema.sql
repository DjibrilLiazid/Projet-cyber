-- SECURESHOP — Schéma SQLite

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT DEFAULT 'user' CHECK(role IN ('user','admin')),
  is_active INTEGER DEFAULT 1,
  failed_login_attempts INTEGER DEFAULT 0,
  locked_until TEXT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  price REAL NOT NULL,
  stock INTEGER DEFAULT 0,
  image_url TEXT DEFAULT '/img/placeholder.png',
  category TEXT,
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  total REAL NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS order_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price REAL NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id),
  FOREIGN KEY (product_id) REFERENCES products(id)
);

CREATE TABLE IF NOT EXISTS cart_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  added_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (product_id) REFERENCES products(id),
  UNIQUE(user_id, product_id)
);

-- Données de test
-- admin : Admin1234!  |  alice : User1234!
INSERT OR IGNORE INTO users (username, email, password_hash, role) VALUES
('admin', 'admin@secureshop.fr', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBpj2T4HFQZ3S2', 'admin'),
('alice',  'alice@example.fr',   '$2b$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',  'user');

INSERT OR IGNORE INTO products (name, description, price, stock, category) VALUES
('Casque Audio Premium', 'Casque sans fil avec réduction de bruit active, autonomie 30h', 149.99, 15, 'Audio'),
('Souris Gaming RGB',    'Souris 16000 DPI, 7 boutons programmables, éclairage RGB', 59.99, 30, 'Gaming'),
('Clavier Mécanique',   'Switches Cherry MX Red, rétroéclairage blanc, format TKL', 89.99, 20, 'Gaming'),
('Webcam 4K',           'Résolution 4K 30fps, microphone intégré, correction auto lumière', 79.99, 10, 'Streaming'),
('SSD NVMe 1To',        'Vitesse lecture 3500 MB/s, format M.2 2280, compatible PS5', 99.99, 25, 'Stockage'),
('Tapis de Souris XL',  'Surface 90x40cm, base antidérapante, coutures renforcées', 24.99, 50, 'Accessoires');
