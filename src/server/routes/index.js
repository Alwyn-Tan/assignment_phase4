const path = require("path");
const express = require("express");

const { publicDir } = require("../constants");
const { asyncHandler } = require("../http");
const {
  attachAuthContext,
  requireAuthPage,
  requireAdminPage,
  redirectAuthenticatedUsers,
} = require("../middleware/auth");
const { createAuthRouter } = require("./auth-routes");
const { createCatalogRouter } = require("./catalog-routes");

function createAppRouter() {
  const router = express.Router();
  router.use(attachAuthContext);

  router.get(
    "/",
    asyncHandler(async (req, res) => {
      res.sendFile(path.join(publicDir, "index.html"));
    })
  );

  router.get("/index.html", (req, res) => {
    res.redirect(302, "/");
  });

  router.get("/login", redirectAuthenticatedUsers, (req, res) => {
    res.sendFile(path.join(publicDir, "login.html"));
  });

  router.get("/login.html", redirectAuthenticatedUsers, (req, res) => {
    res.redirect(302, "/login");
  });

  router.get("/register", redirectAuthenticatedUsers, (req, res) => {
    res.sendFile(path.join(publicDir, "register.html"));
  });

  router.get("/register.html", redirectAuthenticatedUsers, (req, res) => {
    res.redirect(302, "/register");
  });

  router.get("/change-password", requireAuthPage, (req, res) => {
    res.sendFile(path.join(publicDir, "change-password.html"));
  });

  router.get("/change-password.html", requireAuthPage, (req, res) => {
    res.redirect(302, "/change-password");
  });

  router.get("/admin", requireAdminPage, (req, res) => {
    res.sendFile(path.join(publicDir, "admin.html"));
  });

  router.get("/admin.html", requireAdminPage, (req, res) => {
    res.redirect(302, "/admin");
  });

  router.use("/api/auth", createAuthRouter());
  router.use("/api", createCatalogRouter());

  return router;
}

module.exports = {
  createAppRouter,
};
