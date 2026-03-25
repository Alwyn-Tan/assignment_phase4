const express = require("express");

const { asyncHandler } = require("../http");
const { upload } = require("../image-service");
const { requireAdminApi } = require("../middleware/auth");
const {
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  listProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
} = require("../controllers/catalog-controller");

function createCatalogRouter() {
  const router = express.Router();

  router.get("/categories", asyncHandler(listCategories));
  router.post("/categories", requireAdminApi, asyncHandler(createCategory));
  router.put("/categories/:catid", requireAdminApi, asyncHandler(updateCategory));
  router.delete("/categories/:catid", requireAdminApi, asyncHandler(deleteCategory));

  router.get("/products", asyncHandler(listProducts));
  router.get("/products/:pid", asyncHandler(getProduct));
  router.post("/products", requireAdminApi, upload.single("image"), asyncHandler(createProduct));
  router.put("/products/:pid", requireAdminApi, upload.single("image"), asyncHandler(updateProduct));
  router.delete("/products/:pid", requireAdminApi, asyncHandler(deleteProduct));

  return router;
}

module.exports = {
  createCatalogRouter,
};
