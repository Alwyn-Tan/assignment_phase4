const { run, get, all } = require("../../db/database");

async function findAllCategories() {
  return all("SELECT catid, name FROM categories ORDER BY catid ASC", []);
}

async function findCategoryById(catid) {
  return get("SELECT catid, name FROM categories WHERE catid = ?", [catid]);
}

async function insertCategory(name) {
  return run("INSERT INTO categories(name) VALUES (?)", [name]);
}

async function updateCategoryName(catid, name) {
  return run("UPDATE categories SET name = ? WHERE catid = ?", [name, catid]);
}

async function deleteCategoryById(catid) {
  return run("DELETE FROM categories WHERE catid = ?", [catid]);
}

module.exports = {
  findAllCategories,
  findCategoryById,
  insertCategory,
  updateCategoryName,
  deleteCategoryById,
};
