const { run, get } = require("../../db/database");

async function findUserByEmail(email) {
  return get(
    `
      SELECT userid, email, password, display_name, is_admin
      FROM users
      WHERE lower(email) = lower(?)
    `,
    [email]
  );
}

async function findUserById(userid) {
  return get(
    `
      SELECT userid, email, password, display_name, is_admin
      FROM users
      WHERE userid = ?
    `,
    [userid]
  );
}

async function insertUser({ email, passwordHash, displayName, isAdmin = 0 }) {
  return run(
    `
      INSERT INTO users(email, password, display_name, is_admin)
      VALUES (?, ?, ?, ?)
    `,
    [email, passwordHash, displayName, isAdmin]
  );
}

async function updateUserPassword(userid, passwordHash) {
  return run("UPDATE users SET password = ? WHERE userid = ?", [passwordHash, userid]);
}

module.exports = {
  findUserByEmail,
  findUserById,
  insertUser,
  updateUserPassword,
};
