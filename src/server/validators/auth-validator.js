const {
  maxDisplayNameLen,
  maxEmailLen,
  minPasswordLen,
  maxPasswordLen,
} = require("../constants");
const { ValidationError } = require("../errors/app-error");
const {
  stripControlChars,
  sanitizeSingleLineText,
  ensureAllowedFields,
} = require("../validation");

function normalizeEmail(value) {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = stripControlChars(value.normalize("NFKC"))
    .trim()
    .toLowerCase();

  if (!normalized || normalized.length > maxEmailLen) {
    return null;
  }

  if (!/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(normalized)) {
    return null;
  }

  return normalized;
}

function validatePassword(value) {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = stripControlChars(value.normalize("NFKC"));
  if (normalized.length < minPasswordLen || normalized.length > maxPasswordLen) {
    return null;
  }

  return normalized;
}

function parseLoginPayload(body) {
  ensureAllowedFields(body, ["email", "password"]);
  const email = normalizeEmail(body.email);
  const password = validatePassword(body.password);

  if (!email || !password) {
    throw new ValidationError("Email or password is incorrect.");
  }

  return { email, password };
}

function parseRegisterPayload(body) {
  ensureAllowedFields(body, ["display_name", "email", "password", "confirm_password"]);

  const displayName = sanitizeSingleLineText(body.display_name, maxDisplayNameLen);
  const email = normalizeEmail(body.email);
  const password = validatePassword(body.password);
  const confirmPassword = validatePassword(body.confirm_password);

  if (!displayName) {
    throw new ValidationError("Display name is required (1-80 chars, no angle brackets).");
  }
  if (!email) {
    throw new ValidationError("A valid email address is required.");
  }
  if (!password || !confirmPassword) {
    throw new ValidationError("Password must be 8-72 characters without control characters.");
  }
  if (password !== confirmPassword) {
    throw new ValidationError("The two passwords do not match.");
  }

  return {
    displayName,
    email,
    password,
  };
}

function parseChangePasswordPayload(body) {
  ensureAllowedFields(body, ["current_password", "new_password", "confirm_password"]);

  const currentPassword = validatePassword(body.current_password);
  const newPassword = validatePassword(body.new_password);
  const confirmPassword = validatePassword(body.confirm_password);

  if (!currentPassword) {
    throw new ValidationError("Current password is required.");
  }
  if (!newPassword || !confirmPassword) {
    throw new ValidationError("New password must be 8-72 characters without control characters.");
  }
  if (newPassword !== confirmPassword) {
    throw new ValidationError("The two new passwords do not match.");
  }
  if (currentPassword === newPassword) {
    throw new ValidationError("New password must be different from the current password.");
  }

  return {
    currentPassword,
    newPassword,
  };
}

module.exports = {
  parseLoginPayload,
  parseRegisterPayload,
  parseChangePasswordPayload,
};
