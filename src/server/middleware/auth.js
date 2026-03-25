const { authCookieName } = require("../constants");
const { findSessionWithUserById, deleteSessionById } = require("../data/session-queries");
const { mapUserRow, requireMapped } = require("../mappers");

function parseCookieHeader(cookieHeader) {
  const result = {};
  if (typeof cookieHeader !== "string" || !cookieHeader.trim()) {
    return result;
  }

  for (const pair of cookieHeader.split(";")) {
    const [rawName, ...rawValueParts] = pair.split("=");
    const name = rawName ? rawName.trim() : "";
    const value = rawValueParts.join("=").trim();
    if (!name) {
      continue;
    }
    result[name] = decodeURIComponent(value);
  }

  return result;
}

function shouldUseSecureCookies(req) {
  return (
    process.env.NODE_ENV === "production" ||
    req.secure ||
    req.headers["x-forwarded-proto"] === "https"
  );
}

function setAuthCookie(req, res, sid, expiresAt) {
  res.cookie(authCookieName, sid, {
    httpOnly: true,
    sameSite: "lax",
    secure: shouldUseSecureCookies(req),
    expires: new Date(expiresAt),
    path: "/",
  });
}

function clearAuthCookie(req, res) {
  res.clearCookie(authCookieName, {
    httpOnly: true,
    sameSite: "lax",
    secure: shouldUseSecureCookies(req),
    path: "/",
  });
}

function buildGuestAuth() {
  return {
    isAuthenticated: false,
    isAdmin: false,
    sessionId: null,
    user: null,
  };
}

async function attachAuthContext(req, res, next) {
  try {
    const cookies = parseCookieHeader(req.headers.cookie);
    const sessionId = cookies[authCookieName];
    if (!sessionId || !/^[a-f0-9]{64}$/i.test(sessionId)) {
      req.auth = buildGuestAuth();
      next();
      return;
    }

    const row = await findSessionWithUserById(sessionId);
    if (!row) {
      clearAuthCookie(req, res);
      req.auth = buildGuestAuth();
      next();
      return;
    }

    const expiresAt = Number(row.expires_at);
    if (!Number.isFinite(expiresAt) || expiresAt <= Date.now()) {
      await deleteSessionById(sessionId);
      clearAuthCookie(req, res);
      req.auth = buildGuestAuth();
      next();
      return;
    }

    const user = requireMapped(row, mapUserRow);
    req.auth = {
      isAuthenticated: true,
      isAdmin: user.is_admin,
      sessionId,
      user,
    };
    next();
  } catch (err) {
    next(err);
  }
}

function requireAdminApi(req, res, next) {
  if (!req.auth?.isAuthenticated) {
    res.status(401).json({ error: "Please log in first." });
    return;
  }
  if (!req.auth?.isAdmin) {
    res.status(403).json({ error: "Admin access is required." });
    return;
  }
  next();
}

function requireAuthenticatedApi(req, res, next) {
  if (!req.auth?.isAuthenticated) {
    res.status(401).json({ error: "Please log in first." });
    return;
  }
  next();
}

function requireAuthPage(req, res, next) {
  if (!req.auth?.isAuthenticated) {
    res.redirect(302, "/login");
    return;
  }
  next();
}

function requireAdminPage(req, res, next) {
  if (!req.auth?.isAuthenticated) {
    res.redirect(302, "/login");
    return;
  }
  if (!req.auth?.isAdmin) {
    res.redirect(302, "/");
    return;
  }
  next();
}

function redirectAuthenticatedUsers(req, res, next) {
  if (!req.auth?.isAuthenticated) {
    next();
    return;
  }

  res.redirect(302, req.auth.isAdmin ? "/admin" : "/");
}

module.exports = {
  attachAuthContext,
  requireAdminApi,
  requireAuthenticatedApi,
  requireAuthPage,
  requireAdminPage,
  redirectAuthenticatedUsers,
  setAuthCookie,
  clearAuthCookie,
};
