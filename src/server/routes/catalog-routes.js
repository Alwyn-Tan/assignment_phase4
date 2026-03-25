const express = require("express");

const { asyncHandler } = require("../http");
const { upload } = require("../image-service");
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
  router.post("/categories", asyncHandler(createCategory));
  router.put("/categories/:catid", asyncHandler(updateCategory));
  router.delete("/categories/:catid", asyncHandler(deleteCategory));

  router.get("/products", asyncHandler(listProducts));
  router.get("/products/:pid", asyncHandler(getProduct));
  router.post("/products", upload.single("image"), asyncHandler(createProduct));
  router.put("/products/:pid", upload.single("image"), asyncHandler(updateProduct));
  router.delete("/products/:pid", asyncHandler(deleteProduct));

  return router;
}

module.exports = {
  createCatalogRouter,
};
