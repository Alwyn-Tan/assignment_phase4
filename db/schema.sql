PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS categories (
  catid INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE CHECK (length(trim(name)) > 0)
);

CREATE TABLE IF NOT EXISTS products (
  pid INTEGER PRIMARY KEY AUTOINCREMENT,
  catid INTEGER NOT NULL,
  name TEXT NOT NULL CHECK (length(trim(name)) > 0),
  price REAL NOT NULL CHECK (price >= 0),
  description TEXT NOT NULL DEFAULT '',
  image_path TEXT,
  thumb_path TEXT,
  FOREIGN KEY (catid) REFERENCES categories(catid)
    ON UPDATE CASCADE
    ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_products_catid ON products(catid);

CREATE TABLE IF NOT EXISTS users (
  userid INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE COLLATE NOCASE,
  password TEXT NOT NULL,
  display_name TEXT NOT NULL,
  is_admin INTEGER NOT NULL DEFAULT 0 CHECK (is_admin IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sessions (
  sid TEXT PRIMARY KEY,
  userid INTEGER NOT NULL,
  csrf_token TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userid) REFERENCES users(userid)
    ON UPDATE CASCADE
    ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_sessions_userid ON sessions(userid);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);
