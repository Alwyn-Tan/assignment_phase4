const path = require("path");

const PORT = Number(process.env.PORT) || 3000;
const projectRoot = process.cwd();
const publicDir = path.join(projectRoot, "public");
const originalDir = path.join(projectRoot, "uploads", "original");
const thumbDir = path.join(projectRoot, "uploads", "thumb");

const maxUploadBytes = 10 * 1024 * 1024;
const maxCategoryNameLen = 80;
const maxProductNameLen = 120;
const maxDescriptionLen = 4000;

const allowedMimeToExt = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

const originalImagePathRe = /^\/uploads\/original\/[1-9]\d*_original\.(?:jpg|png|webp)$/;
const thumbImagePathRe = /^\/uploads\/thumb\/[1-9]\d*_thumb\.jpg$/;

module.exports = {
  PORT,
  projectRoot,
  publicDir,
  originalDir,
  thumbDir,
  maxUploadBytes,
  maxCategoryNameLen,
  maxProductNameLen,
  maxDescriptionLen,
  allowedMimeToExt,
  originalImagePathRe,
  thumbImagePathRe,
};
