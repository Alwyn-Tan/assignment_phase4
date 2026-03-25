const path = require("path");
const express = require("express");

const { publicDir } = require("../constants");
const { asyncHandler } = require("../http");
const { createCatalogRouter } = require("./catalog-routes");

function createAppRouter() {
  const router = express.Router();

  router.get(
    "/",
    asyncHandler(async (req, res) => {
      res.sendFile(path.join(publicDir, "index.html"));
    })
  );

  router.use("/api", createCatalogRouter());

  return router;
}

module.exports = {
  createAppRouter,
};
