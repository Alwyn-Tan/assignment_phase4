const path = require("path");
const express = require("express");

const { projectRoot, publicDir } = require("./constants");
const {
  applySecurityHeaders,
  blockSensitivePaths,
} = require("./middleware/security");
const { errorHandler } = require("./middleware/error-handler");
const { createAppRouter } = require("./routes");

function createApp() {
  const app = express();

  app.use(express.json({ limit: "64kb" }));
  app.use(express.urlencoded({ extended: true, limit: "64kb" }));
  app.use(applySecurityHeaders);

  app.use("/uploads", express.static(path.join(projectRoot, "uploads")));

  app.use(blockSensitivePaths);
  app.use(express.static(publicDir, { index: false }));
  app.use(createAppRouter());
  app.use(errorHandler);

  return app;
}

module.exports = {
  createApp,
};
