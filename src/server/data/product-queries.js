const { run, get, all } = require("../../db/database");

const selectProductColumns = `
  SELECT p.pid, p.catid, c.name AS category_name, p.name, p.price, p.description, p.image_path, p.thumb_path
  FROM products p
  JOIN categories c ON c.catid = p.catid
`;

async function findAllProducts(catid = null) {
  let sql = selectProductColumns;
  const params = [];

  if (catid) {
    sql += " WHERE p.catid = ?";
    params.push(catid);
  }

  sql += " ORDER BY p.pid ASC";
  return all(sql, params);
}

async function findProductById(pid) {
  return get(`${selectProductColumns} WHERE p.pid = ?`, [pid]);
}

async function insertProduct({ catid, name, price, description }) {
  return run(
    `
      INSERT INTO products(catid, name, price, description, image_path, thumb_path)
      VALUES (?, ?, ?, ?, NULL, NULL)
    `,
    [catid, name, price, description]
  );
}

async function updateProductFields(pid, { catid, name, price, description }) {
  return run(
    `
      UPDATE products
      SET catid = ?, name = ?, price = ?, description = ?
      WHERE pid = ?
    `,
    [catid, name, price, description, pid]
  );
}

async function updateProductImagePaths(pid, { imagePath, thumbPath }) {
  return run(
    "UPDATE products SET image_path = ?, thumb_path = ? WHERE pid = ?",
    [imagePath, thumbPath, pid]
  );
}

async function deleteProductById(pid) {
  return run("DELETE FROM products WHERE pid = ?", [pid]);
}

module.exports = {
  findAllProducts,
  findProductById,
  insertProduct,
  updateProductFields,
  updateProductImagePaths,
  deleteProductById,
};
