const { ConflictError, NotFoundError, ValidationError } = require("../errors/app-error");
const { mapUserRow, requireMapped } = require("../mappers");
const { createRandomToken, hashPassword, verifyPassword } = require("../auth-crypto");
const { sessionDurationMs } = require("../constants");
const {
  findUserByEmail,
  findUserById,
  insertUser,
  updateUserPassword,
} = require("../data/user-queries");
const {
  insertSession,
  deleteSessionById,
  deleteSessionsByUserId,
  deleteExpiredSessions,
} = require("../data/session-queries");

async function registerUser({ displayName, email, password }) {
  const existing = await findUserByEmail(email);
  if (existing) {
    throw new ConflictError("An account with that email already exists.");
  }

  const passwordHash = await hashPassword(password);
  const result = await insertUser({
    email,
    passwordHash,
    displayName,
    isAdmin: 0,
  });

  const created = await findUserById(result.lastID);
  return requireMapped(created, mapUserRow);
}

async function authenticateUser({ email, password }) {
  const user = await findUserByEmail(email);
  if (!user) {
    throw new ValidationError("Email or password is incorrect.");
  }

  const ok = await verifyPassword(password, user.password);
  if (!ok) {
    throw new ValidationError("Email or password is incorrect.");
  }

  return requireMapped(user, mapUserRow);
}

async function createSessionForUser(userid) {
  const user = await findUserById(userid);
  if (!user) {
    throw new NotFoundError("User not found.");
  }

  await deleteExpiredSessions();

  const sid = createRandomToken();
  const csrfToken = createRandomToken();
  const expiresAt = Date.now() + sessionDurationMs;

  await insertSession({
    sid,
    userid,
    csrfToken,
    expiresAt,
  });

  return {
    sid,
    csrfToken,
    expiresAt,
    user: requireMapped(user, mapUserRow),
  };
}

async function destroySession(sid) {
  if (!sid) {
    return;
  }
  await deleteSessionById(sid);
}

async function changePassword(userid, currentPassword, newPassword) {
  const user = await findUserById(userid);
  if (!user) {
    throw new NotFoundError("User not found.");
  }

  const ok = await verifyPassword(currentPassword, user.password);
  if (!ok) {
    throw new ValidationError("Current password is incorrect.");
  }

  const passwordHash = await hashPassword(newPassword);
  await updateUserPassword(userid, passwordHash);
  await deleteSessionsByUserId(userid);
}

module.exports = {
  registerUser,
  authenticateUser,
  createSessionForUser,
  destroySession,
  changePassword,
};
