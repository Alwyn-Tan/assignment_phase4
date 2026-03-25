/**
 * Shared client-side utility helpers.
 * Keep this file framework-agnostic so all pages can reuse the same guards.
 */
(function initClientUtils(global) {
  const uploadImagePathRe = /^\/uploads\/(?:thumb\/[1-9]\d*_thumb\.jpg|original\/[1-9]\d*_original\.(?:jpg|png|webp))$/;

  function stripControlChars(value, keepLineBreaks = false) {
    const pattern = keepLineBreaks
      ? /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g
      : /[\u0000-\u001f\u007f]/g;
    return String(value ?? "").replace(pattern, "");
  }

  function normalizeSingleLineInput(value, maxLen) {
    const normalized = stripControlChars(value)
      .replace(/\s+/g, " ")
      .trim();
    return normalized.slice(0, maxLen);
  }

  function normalizeMultilineInput(value, maxLen) {
    const normalized = stripControlChars(value, true)
      .replace(/\r\n?/g, "\n")
      .trim();
    return normalized.slice(0, maxLen);
  }

  function sanitizeSingleLineText(value, maxLen) {
    return normalizeSingleLineInput(value, maxLen).replace(/[<>]/g, "");
  }

  function sanitizeMultilineText(value, maxLen) {
    return normalizeMultilineInput(value, maxLen).replace(/[<>]/g, "");
  }

  function sanitizeDisplayText(value, maxLen = 4000) {
    return sanitizeMultilineText(value, maxLen) || "";
  }

  function toStrictPositiveInt(value) {
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
    return Number.isSafeInteger(parsed) ? parsed : null;
  }

  function isValidNoAngleBrackets(value, minLen, maxLen) {
    return (
      typeof value === "string" &&
      value.length >= minLen &&
      value.length <= maxLen &&
      !/[<>]/.test(value)
    );
  }

  function isValidPrice(value) {
    return /^\d{1,7}(?:\.\d{1,2})?$/.test(String(value ?? ""));
  }

  function sanitizeUploadImagePath(value) {
    if (typeof value !== "string" || !uploadImagePathRe.test(value)) {
      return "";
    }
    return value;
  }

  global.clientUtils = Object.freeze({
    normalizeSingleLineInput,
    normalizeMultilineInput,
    sanitizeSingleLineText,
    sanitizeMultilineText,
    sanitizeDisplayText,
    toStrictPositiveInt,
    isValidNoAngleBrackets,
    isValidPrice,
    sanitizeUploadImagePath,
  });
})(window);
