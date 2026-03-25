const {
  maxDescriptionLen,
  originalImagePathRe,
  thumbImagePathRe,
} = require("./constants");
const { ValidationError } = require("./errors/app-error");

function stripControlChars(value, keepLineBreaks = false) {
  const pattern = keepLineBreaks
    ? /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g
    : /[\u0000-\u001f\u007f]/g;
  return value.replace(pattern, "");
}

function toPositiveInt(value) {
  if (typeof value === "number") {
    return Number.isSafeInteger(value) && value > 0 ? value : null;
  }
  if (typeof value !== "string") {
    return null;
  }

  const raw = value.trim();
  if (!/^[1-9]\d{0,9}$/.test(raw)) {
    return null;
  }

  const parsed = Number(raw);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    return null;
  }
  return parsed;
}

function sanitizeSingleLineText(value, maxLen) {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = stripControlChars(value.normalize("NFKC"))
    .replace(/\s+/g, " ")
    .trim();

  if (!normalized || normalized.length > maxLen) {
    return null;
  }
  if (/[<>]/.test(normalized)) {
    return null;
  }
  return normalized;
}

function parsePrice(value) {
  if (typeof value !== "string" && typeof value !== "number") {
    return null;
  }

  const raw = String(value).trim();
  if (!/^\d{1,7}(?:\.\d{1,2})?$/.test(raw)) {
    return null;
  }

  const parsed = Number.parseFloat(raw);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return null;
  }
  return Number(parsed.toFixed(2));
}

function normalizeDescription(value) {
  if (value === undefined || value === null) {
    return "";
  }
  if (typeof value !== "string") {
    return null;
  }

  const desc = stripControlChars(value.normalize("NFKC"), true)
    .replace(/\r\n?/g, "\n")
    .trim();

  if (desc.length > maxDescriptionLen) {
    return null;
  }
  if (/[<>]/.test(desc)) {
    return null;
  }
  return desc;
}

function ensureAllowedFields(payload, allowedFields) {
  if (payload === null || payload === undefined) {
    return;
  }
  if (typeof payload !== "object" || Array.isArray(payload)) {
    throw new ValidationError("Malformed form payload.");
  }

  const allowed = new Set(allowedFields);
  for (const key of Object.keys(payload)) {
    if (!allowed.has(key)) {
      throw new ValidationError(`Unexpected field "${key}".`);
    }
  }
}

function toSafeOutputText(value, maxLen) {
  const raw = typeof value === "string" ? value : "";
  const normalized = stripControlChars(raw, true).trim();
  if (!normalized) {
    return "";
  }
  return normalized.slice(0, maxLen);
}

function toSafeOriginalImagePath(value) {
  if (typeof value !== "string" || !originalImagePathRe.test(value)) {
    return null;
  }
  return value;
}

function toSafeThumbImagePath(value) {
  if (typeof value !== "string" || !thumbImagePathRe.test(value)) {
    return null;
  }
  return value;
}

module.exports = {
  stripControlChars,
  toPositiveInt,
  sanitizeSingleLineText,
  parsePrice,
  normalizeDescription,
  ensureAllowedFields,
  toSafeOutputText,
  toSafeOriginalImagePath,
  toSafeThumbImagePath,
};
