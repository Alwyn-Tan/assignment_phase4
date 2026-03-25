function applySecurityHeaders(req, res, next) {
  const csp = [
    "default-src 'self'",
    "base-uri 'self'",
    "frame-ancestors 'none'",
    "object-src 'none'",
    "script-src 'self'",
    "style-src 'self'",
    "img-src 'self' data:",
    "font-src 'self'",
    "connect-src 'self'",
    "form-action 'self'",
  ].join("; ");

  res.setHeader("Content-Security-Policy", csp);
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  next();
}

function blockSensitivePaths(req, res, next) {
  if (
    req.path.startsWith("/db/") ||
    req.path.startsWith("/src/") ||
    req.path.startsWith("/node_modules/") ||
    req.path.startsWith("/.npm-cache/")
  ) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  next();
}

module.exports = {
  applySecurityHeaders,
  blockSensitivePaths,
};
