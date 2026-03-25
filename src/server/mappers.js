const {
  maxCategoryNameLen,
  maxProductNameLen,
  maxDescriptionLen,
} = require("./constants");
const { InternalServerError } = require("./errors/app-error");
const {
  toPositiveInt,
  toSafeOutputText,
  toSafeOriginalImagePath,
  toSafeThumbImagePath,
} = require("./validation");

function mapCategoryRow(row) {
  const catid = toPositiveInt(row?.catid);
  if (!catid) {
    return null;
  }
  return {
    catid,
    name: toSafeOutputText(row.name, maxCategoryNameLen),
  };
}

function mapProductRow(row) {
  const pid = toPositiveInt(row?.pid);
  const catid = toPositiveInt(row?.catid);
  if (!pid || !catid) {
    return null;
  }

  const priceNum = Number(row.price);
  const safePrice = Number.isFinite(priceNum) && priceNum >= 0
    ? Number(priceNum.toFixed(2))
    : 0;

  return {
    pid,
    catid,
    category_name: toSafeOutputText(row.category_name, maxCategoryNameLen),
    name: toSafeOutputText(row.name, maxProductNameLen),
    price: safePrice,
    description: toSafeOutputText(row.description, maxDescriptionLen),
    image_path: toSafeOriginalImagePath(row.image_path),
    thumb_path: toSafeThumbImagePath(row.thumb_path),
  };
}

function requireMapped(row, mapper) {
  const mapped = mapper(row);
  if (!mapped) {
    throw new InternalServerError("Internal data validation failed.");
  }
  return mapped;
}

module.exports = {
  mapCategoryRow,
  mapProductRow,
  requireMapped,
};
