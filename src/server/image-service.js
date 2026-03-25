const fs = require("fs/promises");
const path = require("path");
const multer = require("multer");
const sharp = require("sharp");

const {
  originalDir,
  thumbDir,
  maxUploadBytes,
  allowedMimeToExt,
} = require("./constants");
const { ValidationError } = require("./errors/app-error");

async function ensureUploadDirs() {
  await fs.mkdir(originalDir, { recursive: true });
  await fs.mkdir(thumbDir, { recursive: true });
}

async function removeProductImages(pid) {
  const prefix = `${pid}_`;
  const dirs = [originalDir, thumbDir];

  for (const dir of dirs) {
    let files = [];
    try {
      files = await fs.readdir(dir);
    } catch (err) {
      if (err.code === "ENOENT") {
        continue;
      }
      throw err;
    }

    const targets = files.filter((name) => name.startsWith(prefix));
    await Promise.all(
      targets.map(async (name) => {
        try {
          await fs.unlink(path.join(dir, name));
        } catch (err) {
          if (err.code !== "ENOENT") {
            throw err;
          }
        }
      })
    );
  }
}

async function processAndStoreImage(pid, file) {
  const ext = allowedMimeToExt[file.mimetype];
  if (!ext) {
    throw new ValidationError("Unsupported image format. Use jpg/png/webp.");
  }
  if (!file.buffer || !file.buffer.length) {
    throw new ValidationError("Image file is empty.");
  }

  try {
    await removeProductImages(pid);

    const originalName = `${pid}_original.${ext}`;
    const thumbName = `${pid}_thumb.jpg`;
    const originalAbsPath = path.join(originalDir, originalName);
    const thumbAbsPath = path.join(thumbDir, thumbName);

    const pipeline = sharp(file.buffer).rotate().resize({
      width: 1400,
      height: 1400,
      fit: "inside",
      withoutEnlargement: true,
    });

    if (ext === "png") {
      await pipeline.png({ compressionLevel: 9 }).toFile(originalAbsPath);
    } else if (ext === "webp") {
      await pipeline.webp({ quality: 86 }).toFile(originalAbsPath);
    } else {
      await pipeline.jpeg({ quality: 86 }).toFile(originalAbsPath);
    }

    await sharp(file.buffer)
      .rotate()
      .resize(360, 360, { fit: "cover" })
      .jpeg({ quality: 82 })
      .toFile(thumbAbsPath);

    return {
      imagePath: `/uploads/original/${originalName}`,
      thumbPath: `/uploads/thumb/${thumbName}`,
    };
  } catch (err) {
    throw new ValidationError("Invalid image content.");
  }
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: maxUploadBytes,
  },
  fileFilter: (req, file, cb) => {
    if (!allowedMimeToExt[file.mimetype]) {
      cb(new ValidationError("Only jpg/png/webp images are allowed."));
      return;
    }
    cb(null, true);
  },
});

module.exports = {
  upload,
  ensureUploadDirs,
  removeProductImages,
  processAndStoreImage,
};
