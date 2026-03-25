const { run, get } = require("../../db/database");

async function findSessionWithUserById(sid) {
  return get(
    `
      SELECT
        s.sid,
        s.userid,
        s.csrf_token,
        s.expires_at,
        u.email,
        u.password,
        u.display_name,
        u.is_admin
      FROM sessions s
      JOIN users u ON u.userid = s.userid
      WHERE s.sid = ?
    `,
    [sid]
  );
}

async function insertSession({ sid, userid, csrfToken, expiresAt }) {
  return run(
    `
      INSERT INTO sessions(sid, userid, csrf_token, expires_at)
      VALUES (?, ?, ?, ?)
    `,
    [sid, userid, csrfToken, expiresAt]
  );
}

async function deleteSessionById(sid) {
  return run("DELETE FROM sessions WHERE sid = ?", [sid]);
}

async function deleteSessionsByUserId(userid) {
  return run("DELETE FROM sessions WHERE userid = ?", [userid]);
}

async function deleteExpiredSessions(now = Date.now()) {
  return run("DELETE FROM sessions WHERE expires_at <= ?", [now]);
}

module.exports = {
  findSessionWithUserById,
  insertSession,
  deleteSessionById,
  deleteSessionsByUserId,
  deleteExpiredSessions,
};
