const { mapCategoryRow, mapProductRow, requireMapped } = require("../mappers");
const catalogService = require("../services/catalog-service");
const {
  requireCategoryId,
  requireProductId,
  parseCategoryListQuery,
  parseCategoryPayload,
  parseProductPayload,
} = require("../validators/catalog-validator");

async function listCategories(req, res) {
  const rows = await catalogService.listCategories();
  const safeRows = rows.map(mapCategoryRow).filter(Boolean);
  res.json(safeRows);
}

async function createCategory(req, res) {
  const { name } = parseCategoryPayload(req.body);

  const created = await catalogService.createCategory(name);
  res.status(201).json(requireMapped(created, mapCategoryRow));
}

async function updateCategory(req, res) {
  const catid = requireCategoryId(req.params.catid);
  const { name } = parseCategoryPayload(req.body);

  const updated = await catalogService.updateCategory(catid, name);
  res.json(requireMapped(updated, mapCategoryRow));
}

async function deleteCategory(req, res) {
  const catid = requireCategoryId(req.params.catid);

  await catalogService.deleteCategory(catid);
  res.json({ success: true });
}

async function listProducts(req, res) {
  const { catid } = parseCategoryListQuery(req.query);

  const rows = await catalogService.listProducts(catid);
  const safeRows = rows.map(mapProductRow).filter(Boolean);
  res.json(safeRows);
}

async function getProduct(req, res) {
  const pid = requireProductId(req.params.pid);

  const row = await catalogService.getProductById(pid);
  res.json(requireMapped(row, mapProductRow));
}

async function createProduct(req, res) {
  const payload = parseProductPayload(req.body);

  const created = await catalogService.createProduct({
    ...payload,
    imageFile: req.file,
  });

  res.status(201).json(requireMapped(created, mapProductRow));
}

async function updateProduct(req, res) {
  const pid = requireProductId(req.params.pid);
  const payload = parseProductPayload(req.body);

  const updated = await catalogService.updateProduct(pid, {
    ...payload,
    imageFile: req.file,
  });

  res.json(requireMapped(updated, mapProductRow));
}

async function deleteProduct(req, res) {
  const pid = requireProductId(req.params.pid);

  await catalogService.deleteProduct(pid);
  res.json({ success: true });
}

module.exports = {
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  listProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
};
