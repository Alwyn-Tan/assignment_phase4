const { exec, get, run } = require("../db/database");
const { hashPassword } = require("./auth-crypto");

const defaultUsers = [
  {
    email: "admin@futuredrinks.test",
    password: "Admin123!",
    displayName: "Admin User",
    isAdmin: 1,
  },
  {
    email: "user@futuredrinks.test",
    password: "User12345!",
    displayName: "Normal User",
    isAdmin: 0,
  },
];

async function ensureAuthTablesAndSeedUsers() {
  await exec(`
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
  `);

  const row = await get("SELECT COUNT(*) AS count FROM users", []);
  const count = Number(row?.count) || 0;
  if (count > 0) {
    await run("DELETE FROM sessions WHERE expires_at <= ?", [Date.now()]);
    return;
  }

  for (const user of defaultUsers) {
    const passwordHash = await hashPassword(user.password);
    await run(
      `
        INSERT INTO users(email, password, display_name, is_admin)
        VALUES (?, ?, ?, ?)
      `,
      [user.email, passwordHash, user.displayName, user.isAdmin]
    );
  }
}

module.exports = {
  ensureAuthTablesAndSeedUsers,
};
