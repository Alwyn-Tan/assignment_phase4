const {
  parseLoginPayload,
  parseRegisterPayload,
  parseChangePasswordPayload,
} = require("../validators/auth-validator");
const {
  registerUser,
  authenticateUser,
  createSessionForUser,
  destroySession,
  changePassword,
} = require("../services/auth-service");
const {
  clearAuthCookie,
  setAuthCookie,
} = require("../middleware/auth");

function createAuthPayload(auth) {
  return {
    authenticated: Boolean(auth?.isAuthenticated),
    user: auth?.user || null,
  };
}

async function getCurrentUser(req, res) {
  res.json(createAuthPayload(req.auth));
}

async function register(req, res) {
  const payload = parseRegisterPayload(req.body);
  const user = await registerUser(payload);

  if (req.auth?.sessionId) {
    await destroySession(req.auth.sessionId);
  }

  const session = await createSessionForUser(user.userid);
  setAuthCookie(req, res, session.sid, session.expiresAt);

  res.status(201).json({
    authenticated: true,
    user: session.user,
    redirectTo: "/",
  });
}

async function login(req, res) {
  const payload = parseLoginPayload(req.body);
  const user = await authenticateUser(payload);

  if (req.auth?.sessionId) {
    await destroySession(req.auth.sessionId);
  }

  const session = await createSessionForUser(user.userid);
  setAuthCookie(req, res, session.sid, session.expiresAt);

  res.json({
    authenticated: true,
    user: session.user,
    redirectTo: session.user.is_admin ? "/admin" : "/",
  });
}

async function logout(req, res) {
  if (req.auth?.sessionId) {
    await destroySession(req.auth.sessionId);
  }
  clearAuthCookie(req, res);
  res.json({ success: true, redirectTo: "/login" });
}

async function updatePassword(req, res) {
  const { currentPassword, newPassword } = parseChangePasswordPayload(req.body);
  await changePassword(req.auth.user.userid, currentPassword, newPassword);
  clearAuthCookie(req, res);
  res.json({
    success: true,
    redirectTo: "/login",
  });
}

module.exports = {
  getCurrentUser,
  register,
  login,
  logout,
  updatePassword,
};
