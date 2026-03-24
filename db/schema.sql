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
