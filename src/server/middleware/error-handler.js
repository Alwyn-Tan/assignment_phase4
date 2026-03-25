const multer = require("multer");
const { AppError } = require("../errors/app-error");

function errorHandler(err, req, res, next) {
  if (err instanceof SyntaxError && Object.prototype.hasOwnProperty.call(err, "body")) {
    res.status(400).json({ error: "Malformed JSON payload." });
    return;
  }

  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      res.status(400).json({ error: "Image is too large (max 10MB)." });
      return;
    }
    res.status(400).json({ error: err.message });
    return;
  }

  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: err.message });
    return;
  }

  console.error(err);
  res.status(500).json({ error: "Internal server error." });
}

module.exports = {
  errorHandler,
};
