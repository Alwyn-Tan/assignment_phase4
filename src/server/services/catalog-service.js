const {
  findAllCategories,
  findCategoryById,
  insertCategory,
  updateCategoryName,
  deleteCategoryById,
} = require("../data/category-queries");
const {
  findAllProducts,
  findProductById,
  insertProduct,
  updateProductFields,
  updateProductImagePaths,
  deleteProductById,
} = require("../data/product-queries");
const {
  processAndStoreImage,
  removeProductImages,
} = require("../image-service");
const {
  ValidationError,
  NotFoundError,
  ConflictError,
} = require("../errors/app-error");

async function ensureCategoryExists(catid) {
  const category = await findCategoryById(catid);
  if (!category) {
    throw new ValidationError("Selected category does not exist.");
  }
}

async function ensureProductExists(pid) {
  const product = await findProductById(pid);
  if (!product) {
    throw new NotFoundError("Product not found.");
  }
}

async function listCategories() {
  return findAllCategories();
}

async function createCategory(name) {
  try {
    const result = await insertCategory(name);
    return findCategoryById(result.lastID);
  } catch (err) {
    if (String(err.message).includes("UNIQUE")) {
      throw new ConflictError("Category name already exists.");
    }
    throw err;
  }
}

async function updateCategory(catid, name) {
  try {
    const result = await updateCategoryName(catid, name);
    if (!result.changes) {
      throw new NotFoundError("Category not found.");
    }

    return findCategoryById(catid);
  } catch (err) {
    if (String(err.message).includes("UNIQUE")) {
      throw new ConflictError("Category name already exists.");
    }
    throw err;
  }
}

async function deleteCategory(catid) {
  try {
    const result = await deleteCategoryById(catid);
    if (!result.changes) {
      throw new NotFoundError("Category not found.");
    }
  } catch (err) {
    if (String(err.message).includes("FOREIGN KEY")) {
      throw new ConflictError("Delete products in this category before deleting it.");
    }
    throw err;
  }
}

async function listProducts(catid = null) {
  return findAllProducts(catid);
}

async function getProductById(pid) {
  const row = await findProductById(pid);
  if (!row) {
    throw new NotFoundError("Product not found.");
  }
  return row;
}

async function createProduct({ catid, name, price, description, imageFile }) {
  await ensureCategoryExists(catid);

  const insertResult = await insertProduct({ catid, name, price, description });

  const pid = insertResult.lastID;
  if (imageFile) {
    const paths = await processAndStoreImage(pid, imageFile);
    await updateProductImagePaths(pid, paths);
  }

  return getProductById(pid);
}

async function updateProduct(pid, { catid, name, price, description, imageFile }) {
  await ensureProductExists(pid);
  await ensureCategoryExists(catid);

  await updateProductFields(pid, { catid, name, price, description });

  if (imageFile) {
    const paths = await processAndStoreImage(pid, imageFile);
    await updateProductImagePaths(pid, paths);
  }

  return getProductById(pid);
}

async function deleteProduct(pid) {
  await ensureProductExists(pid);
  await deleteProductById(pid);
  await removeProductImages(pid);
}

module.exports = {
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  listProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};
