const express = require("express");

const { asyncHandler } = require("../http");
const { requireAuthenticatedApi } = require("../middleware/auth");
const {
  getCurrentUser,
  register,
  login,
  logout,
  updatePassword,
} = require("../controllers/auth-controller");

function createAuthRouter() {
  const router = express.Router();

  router.get("/me", asyncHandler(getCurrentUser));
  router.post("/register", asyncHandler(register));
  router.post("/login", asyncHandler(login));
  router.post("/logout", asyncHandler(logout));
  router.post("/change-password", requireAuthenticatedApi, asyncHandler(updatePassword));

  return router;
}

module.exports = {
  createAuthRouter,
};
