const fs = require("fs/promises");
const path = require("path");
const express = require("express");
const multer = require("multer");
const sharp = require("sharp");
const { run, get, all } = require("./src/db/database");

const app = express();
const PORT = Number(process.env.PORT) || 3000;

const rootDir = process.cwd();
const originalDir = path.join(rootDir, "uploads", "original");
const thumbDir = path.join(rootDir, "uploads", "thumb");
const maxUploadBytes = 10 * 1024 * 1024;
const allowedMimeToExt = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

function httpError(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}

function toPositiveInt(value) {
  const parsed = Number.parseInt(String(value), 10);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }
  return parsed;
}

function sanitizeText(value, maxLen = 255) {
  const safeValue = typeof value === "string" ? value.trim() : "";
  if (!safeValue || safeValue.length > maxLen) {
    return null;
  }
  return safeValue;
}

function parsePrice(value) {
  const parsed = Number.parseFloat(String(value));
  if (!Number.isFinite(parsed) || parsed < 0) {
    return null;
  }
  return Number(parsed.toFixed(2));
}

function normalizeDescription(value) {
  if (value === undefined || value === null) {
    return "";
  }
  const desc = String(value).trim();
  return desc.length > 4000 ? desc.slice(0, 4000) : desc;
}

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
    throw httpError(400, "Unsupported image format. Use jpg/png/webp.");
  }

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
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: maxUploadBytes,
  },
  fileFilter: (req, file, cb) => {
    if (!allowedMimeToExt[file.mimetype]) {
      cb(httpError(400, "Only jpg/png/webp images are allowed."));
      return;
    }
    cb(null, true);
  },
});

function asyncHandler(handler) {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/uploads", express.static(path.join(rootDir, "uploads")));
app.use("/admin.js", express.static(path.join(rootDir, "admin.js")));
app.use("/styles.css", express.static(path.join(rootDir, "styles.css")));

app.use((req, res, next) => {
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
});

app.use(express.static(rootDir, { index: false }));

app.get(
  "/",
  asyncHandler(async (req, res) => {
    res.sendFile(path.join(rootDir, "index.html"));
  })
);

app.get(
  "/api/categories",
  asyncHandler(async (req, res) => {
    const rows = await all(
      "SELECT catid, name FROM categories ORDER BY catid ASC",
      []
    );
    res.json(rows);
  })
);

app.post(
  "/api/categories",
  asyncHandler(async (req, res) => {
    const name = sanitizeText(req.body.name, 80);
    if (!name) {
      throw httpError(400, "Category name is required (1-80 chars).");
    }

    try {
      const result = await run("INSERT INTO categories(name) VALUES (?)", [name]);
      const created = await get(
        "SELECT catid, name FROM categories WHERE catid = ?",
        [result.lastID]
      );
      res.status(201).json(created);
    } catch (err) {
      if (String(err.message).includes("UNIQUE")) {
        throw httpError(409, "Category name already exists.");
      }
      throw err;
    }
  })
);

app.put(
  "/api/categories/:catid",
  asyncHandler(async (req, res) => {
    const catid = toPositiveInt(req.params.catid);
    if (!catid) {
      throw httpError(400, "Invalid category id.");
    }

    const name = sanitizeText(req.body.name, 80);
    if (!name) {
      throw httpError(400, "Category name is required (1-80 chars).");
    }

    try {
      const result = await run(
        "UPDATE categories SET name = ? WHERE catid = ?",
        [name, catid]
      );
      if (!result.changes) {
        throw httpError(404, "Category not found.");
      }
      const updated = await get(
        "SELECT catid, name FROM categories WHERE catid = ?",
        [catid]
      );
      res.json(updated);
    } catch (err) {
      if (String(err.message).includes("UNIQUE")) {
        throw httpError(409, "Category name already exists.");
      }
      throw err;
    }
  })
);

app.delete(
  "/api/categories/:catid",
  asyncHandler(async (req, res) => {
    const catid = toPositiveInt(req.params.catid);
    if (!catid) {
      throw httpError(400, "Invalid category id.");
    }

    try {
      const result = await run("DELETE FROM categories WHERE catid = ?", [catid]);
      if (!result.changes) {
        throw httpError(404, "Category not found.");
      }
      res.json({ success: true });
    } catch (err) {
      if (String(err.message).includes("FOREIGN KEY")) {
        throw httpError(409, "Delete products in this category before deleting it.");
      }
      throw err;
    }
  })
);

app.get(
  "/api/products",
  asyncHandler(async (req, res) => {
    const catid = req.query.catid ? toPositiveInt(req.query.catid) : null;
    if (req.query.catid && !catid) {
      throw httpError(400, "Invalid category id.");
    }

    let sql = `
      SELECT p.pid, p.catid, c.name AS category_name, p.name, p.price, p.description, p.image_path, p.thumb_path
      FROM products p
      JOIN categories c ON c.catid = p.catid
    `;
    const params = [];
    if (catid) {
      sql += " WHERE p.catid = ?";
      params.push(catid);
    }
    sql += " ORDER BY p.pid ASC";

    const rows = await all(sql, params);
    res.json(rows);
  })
);

app.get(
  "/api/products/:pid",
  asyncHandler(async (req, res) => {
    const pid = toPositiveInt(req.params.pid);
    if (!pid) {
      throw httpError(400, "Invalid product id.");
    }

    const row = await get(
      `
        SELECT p.pid, p.catid, c.name AS category_name, p.name, p.price, p.description, p.image_path, p.thumb_path
        FROM products p
        JOIN categories c ON c.catid = p.catid
        WHERE p.pid = ?
      `,
      [pid]
    );
    if (!row) {
      throw httpError(404, "Product not found.");
    }
    res.json(row);
  })
);

app.post(
  "/api/products",
  upload.single("image"),
  asyncHandler(async (req, res) => {
    const catid = toPositiveInt(req.body.catid);
    const name = sanitizeText(req.body.name, 120);
    const price = parsePrice(req.body.price);
    const description = normalizeDescription(req.body.description);

    if (!catid) {
      throw httpError(400, "Valid category is required.");
    }
    if (!name) {
      throw httpError(400, "Product name is required (1-120 chars).");
    }
    if (price === null) {
      throw httpError(400, "Price must be a number >= 0.");
    }

    const category = await get("SELECT catid FROM categories WHERE catid = ?", [
      catid,
    ]);
    if (!category) {
      throw httpError(400, "Selected category does not exist.");
    }

    const insertResult = await run(
      `
        INSERT INTO products(catid, name, price, description, image_path, thumb_path)
        VALUES (?, ?, ?, ?, NULL, NULL)
      `,
      [catid, name, price, description]
    );

    const pid = insertResult.lastID;
    if (req.file) {
      const paths = await processAndStoreImage(pid, req.file);
      await run(
        "UPDATE products SET image_path = ?, thumb_path = ? WHERE pid = ?",
        [paths.imagePath, paths.thumbPath, pid]
      );
    }

    const created = await get(
      `
        SELECT p.pid, p.catid, c.name AS category_name, p.name, p.price, p.description, p.image_path, p.thumb_path
        FROM products p
        JOIN categories c ON c.catid = p.catid
        WHERE p.pid = ?
      `,
      [pid]
    );
    res.status(201).json(created);
  })
);

app.put(
  "/api/products/:pid",
  upload.single("image"),
  asyncHandler(async (req, res) => {
    const pid = toPositiveInt(req.params.pid);
    if (!pid) {
      throw httpError(400, "Invalid product id.");
    }

    const catid = toPositiveInt(req.body.catid);
    const name = sanitizeText(req.body.name, 120);
    const price = parsePrice(req.body.price);
    const description = normalizeDescription(req.body.description);

    if (!catid) {
      throw httpError(400, "Valid category is required.");
    }
    if (!name) {
      throw httpError(400, "Product name is required (1-120 chars).");
    }
    if (price === null) {
      throw httpError(400, "Price must be a number >= 0.");
    }

    const existing = await get("SELECT pid FROM products WHERE pid = ?", [pid]);
    if (!existing) {
      throw httpError(404, "Product not found.");
    }

    const category = await get("SELECT catid FROM categories WHERE catid = ?", [
      catid,
    ]);
    if (!category) {
      throw httpError(400, "Selected category does not exist.");
    }

    await run(
      `
        UPDATE products
        SET catid = ?, name = ?, price = ?, description = ?
        WHERE pid = ?
      `,
      [catid, name, price, description, pid]
    );

    if (req.file) {
      const paths = await processAndStoreImage(pid, req.file);
      await run(
        "UPDATE products SET image_path = ?, thumb_path = ? WHERE pid = ?",
        [paths.imagePath, paths.thumbPath, pid]
      );
    }

    const updated = await get(
      `
        SELECT p.pid, p.catid, c.name AS category_name, p.name, p.price, p.description, p.image_path, p.thumb_path
        FROM products p
        JOIN categories c ON c.catid = p.catid
        WHERE p.pid = ?
      `,
      [pid]
    );
    res.json(updated);
  })
);

app.delete(
  "/api/products/:pid",
  asyncHandler(async (req, res) => {
    const pid = toPositiveInt(req.params.pid);
    if (!pid) {
      throw httpError(400, "Invalid product id.");
    }

    const existing = await get("SELECT pid FROM products WHERE pid = ?", [pid]);
    if (!existing) {
      throw httpError(404, "Product not found.");
    }

    await run("DELETE FROM products WHERE pid = ?", [pid]);
    await removeProductImages(pid);

    res.json({ success: true });
  })
);

app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      res.status(400).json({ error: "Image is too large (max 10MB)." });
      return;
    }
    res.status(400).json({ error: err.message });
    return;
  }

  if (err && err.status) {
    res.status(err.status).json({ error: err.message });
    return;
  }

  console.error(err);
  res.status(500).json({ error: "Internal server error." });
});

async function start() {
  await ensureUploadDirs();
  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

start().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
