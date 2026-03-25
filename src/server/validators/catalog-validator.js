const {
  maxCategoryNameLen,
  maxProductNameLen,
} = require("../constants");
const { ValidationError } = require("../errors/app-error");
const {
  toPositiveInt,
  sanitizeSingleLineText,
  parsePrice,
  normalizeDescription,
  ensureAllowedFields,
} = require("../validation");

function requireCategoryId(value) {
  const catid = toPositiveInt(value);
  if (!catid) {
    throw new ValidationError("Invalid category id.");
  }
  return catid;
}

function requireProductId(value) {
  const pid = toPositiveInt(value);
  if (!pid) {
    throw new ValidationError("Invalid product id.");
  }
  return pid;
}

function parseCategoryListQuery(query) {
  const rawCatid = typeof query.catid === "string" ? query.catid : "";
  const catid = rawCatid ? toPositiveInt(rawCatid) : null;
  if (query.catid && !catid) {
    throw new ValidationError("Invalid category id.");
  }
  return { catid };
}

function parseCategoryPayload(body) {
  ensureAllowedFields(body, ["name"]);
  const name = sanitizeSingleLineText(body.name, maxCategoryNameLen);
  if (!name) {
    throw new ValidationError("Category name is required (1-80 chars, no angle brackets).");
  }
  return { name };
}

function parseProductPayload(body) {
  ensureAllowedFields(body, ["catid", "name", "price", "description"]);

  const catid = toPositiveInt(body.catid);
  const name = sanitizeSingleLineText(body.name, maxProductNameLen);
  const price = parsePrice(body.price);
  const description = normalizeDescription(body.description);

  if (!catid) {
    throw new ValidationError("Valid category is required.");
  }
  if (!name) {
    throw new ValidationError("Product name is required (1-120 chars, no angle brackets).");
  }
  if (price === null) {
    throw new ValidationError("Price must be a number >= 0 with up to 2 decimals.");
  }
  if (description === null) {
    throw new ValidationError("Description must be <= 4000 chars and cannot contain angle brackets.");
  }

  return {
    catid,
    name,
    price,
    description,
  };
}

module.exports = {
  requireCategoryId,
  requireProductId,
  parseCategoryListQuery,
  parseCategoryPayload,
  parseProductPayload,
};
