const statusEl = document.getElementById("status");

const categoryForm = document.getElementById("category-form");
const categoryIdInput = document.getElementById("category-id");
const categoryNameInput = document.getElementById("category-name");
const categorySubmitBtn = document.getElementById("category-submit");
const categoryCancelBtn = document.getElementById("category-cancel");
const categoryTbody = document.getElementById("category-tbody");

const productForm = document.getElementById("product-form");
const productIdInput = document.getElementById("product-id");
const productCatidSelect = document.getElementById("product-catid");
const productNameInput = document.getElementById("product-name");
const productPriceInput = document.getElementById("product-price");
const productDescInput = document.getElementById("product-description");
const productImageInput = document.getElementById("product-image");
const productPreview = document.getElementById("product-preview");
const productSubmitBtn = document.getElementById("product-submit");
const productCancelBtn = document.getElementById("product-cancel");
const productFilterCatid = document.getElementById("product-filter-catid");
const productTbody = document.getElementById("product-tbody");

const state = {
  categories: [],
  products: [],
};

function setStatus(message, type = "info") {
  statusEl.textContent = message;
  statusEl.className = `admin-status ${type}`;
}

async function apiFetch(url, options = {}) {
  const response = await fetch(url, options);
  let payload;

  try {
    payload = await response.json();
  } catch (err) {
    payload = null;
  }

  if (!response.ok) {
    const error = payload && payload.error ? payload.error : "Request failed.";
    throw new Error(error);
  }

  return payload;
}

function clearCategoryForm() {
  categoryIdInput.value = "";
  categoryForm.reset();
  categorySubmitBtn.textContent = "Add Category";
}

function clearProductForm() {
  productIdInput.value = "";
  productForm.reset();
  productSubmitBtn.textContent = "Add Product";
  productPreview.src = "";
}

function buildCategoryOptions() {
  productCatidSelect.innerHTML = "";
  productFilterCatid.innerHTML = "";

  const allOption = document.createElement("option");
  allOption.value = "";
  allOption.textContent = "All";
  productFilterCatid.appendChild(allOption);

  for (const cat of state.categories) {
    const createOption = document.createElement("option");
    createOption.value = String(cat.catid);
    createOption.textContent = `${cat.name} (#${cat.catid})`;
    productCatidSelect.appendChild(createOption);

    const filterOption = document.createElement("option");
    filterOption.value = String(cat.catid);
    filterOption.textContent = `${cat.name} (#${cat.catid})`;
    productFilterCatid.appendChild(filterOption);
  }

  if (!state.categories.length) {
    const emptyOption = document.createElement("option");
    emptyOption.value = "";
    emptyOption.textContent = "No categories available";
    productCatidSelect.appendChild(emptyOption);
    productCatidSelect.disabled = true;
    productSubmitBtn.disabled = true;
  } else {
    productCatidSelect.disabled = false;
    productSubmitBtn.disabled = false;
  }
}

function createActionButton(action, text) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = action === "delete" ? "button danger small" : "button small";
  btn.dataset.action = action;
  btn.textContent = text;
  return btn;
}

function renderCategoryTable() {
  categoryTbody.innerHTML = "";
  for (const cat of state.categories) {
    const tr = document.createElement("tr");

    const idTd = document.createElement("td");
    idTd.textContent = String(cat.catid);

    const nameTd = document.createElement("td");
    nameTd.textContent = cat.name;

    const actionTd = document.createElement("td");
    actionTd.className = "action-cell";
    const editBtn = createActionButton("edit", "Edit");
    editBtn.dataset.catid = String(cat.catid);
    const delBtn = createActionButton("delete", "Delete");
    delBtn.dataset.catid = String(cat.catid);
    actionTd.append(editBtn, delBtn);

    tr.append(idTd, nameTd, actionTd);
    categoryTbody.appendChild(tr);
  }
}

function renderProductTable() {
  productTbody.innerHTML = "";
  const filteredCatid = productFilterCatid.value ? Number(productFilterCatid.value) : null;
  const rows = filteredCatid
    ? state.products.filter((product) => product.catid === filteredCatid)
    : state.products;

  for (const product of rows) {
    const tr = document.createElement("tr");

    const pidTd = document.createElement("td");
    pidTd.textContent = String(product.pid);

    const nameTd = document.createElement("td");
    nameTd.textContent = product.name;

    const catTd = document.createElement("td");
    catTd.textContent = product.category_name;

    const priceTd = document.createElement("td");
    priceTd.textContent = `$${Number(product.price).toFixed(2)}`;

    const descTd = document.createElement("td");
    descTd.textContent = product.description || "";

    const imgTd = document.createElement("td");
    if (product.thumb_path) {
      const img = document.createElement("img");
      img.src = product.thumb_path;
      img.alt = product.name;
      img.className = "thumb-mini";
      imgTd.appendChild(img);
    } else {
      imgTd.textContent = "-";
    }

    const actionTd = document.createElement("td");
    actionTd.className = "action-cell";
    const editBtn = createActionButton("edit", "Edit");
    editBtn.dataset.pid = String(product.pid);
    const delBtn = createActionButton("delete", "Delete");
    delBtn.dataset.pid = String(product.pid);
    actionTd.append(editBtn, delBtn);

    tr.append(pidTd, nameTd, catTd, priceTd, descTd, imgTd, actionTd);
    productTbody.appendChild(tr);
  }
}

async function loadCategories() {
  state.categories = await apiFetch("/api/categories");
  buildCategoryOptions();
  renderCategoryTable();
}

async function loadProducts() {
  state.products = await apiFetch("/api/products");
  renderProductTable();
}

function startCategoryEdit(catid) {
  const cat = state.categories.find((item) => item.catid === catid);
  if (!cat) {
    return;
  }
  categoryIdInput.value = String(cat.catid);
  categoryNameInput.value = cat.name;
  categorySubmitBtn.textContent = "Update Category";
  categoryNameInput.focus();
}

function startProductEdit(pid) {
  const product = state.products.find((item) => item.pid === pid);
  if (!product) {
    return;
  }

  productIdInput.value = String(product.pid);
  productCatidSelect.value = String(product.catid);
  productNameInput.value = product.name;
  productPriceInput.value = Number(product.price).toFixed(2);
  productDescInput.value = product.description || "";
  productPreview.src = product.thumb_path || "";
  productImageInput.value = "";
  productSubmitBtn.textContent = "Update Product";
  productNameInput.focus();
}

categoryForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const name = categoryNameInput.value.trim();
  if (!name) {
    setStatus("Category name cannot be empty.", "error");
    return;
  }

  try {
    const catid = categoryIdInput.value ? Number(categoryIdInput.value) : null;
    if (catid) {
      await apiFetch(`/api/categories/${catid}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      setStatus("Category updated.", "success");
    } else {
      await apiFetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      setStatus("Category created.", "success");
    }
    clearCategoryForm();
    await loadCategories();
    await loadProducts();
  } catch (err) {
    setStatus(err.message, "error");
  }
});

categoryCancelBtn.addEventListener("click", () => {
  clearCategoryForm();
  setStatus("Category edit cancelled.", "info");
});

categoryTbody.addEventListener("click", async (event) => {
  const btn = event.target.closest("button[data-action]");
  if (!btn) {
    return;
  }

  const action = btn.dataset.action;
  const catid = Number(btn.dataset.catid);
  if (!catid) {
    return;
  }

  if (action === "edit") {
    startCategoryEdit(catid);
    return;
  }

  if (action === "delete") {
    const confirmed = window.confirm(`Delete category #${catid}?`);
    if (!confirmed) {
      return;
    }

    try {
      await apiFetch(`/api/categories/${catid}`, { method: "DELETE" });
      setStatus("Category deleted.", "success");
      clearCategoryForm();
      await loadCategories();
      await loadProducts();
    } catch (err) {
      setStatus(err.message, "error");
    }
  }
});

productForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!state.categories.length) {
    setStatus("Create at least one category before adding products.", "error");
    return;
  }

  const formData = new FormData();
  formData.append("catid", productCatidSelect.value);
  formData.append("name", productNameInput.value.trim());
  formData.append("price", productPriceInput.value.trim());
  formData.append("description", productDescInput.value.trim());
  if (productImageInput.files[0]) {
    formData.append("image", productImageInput.files[0]);
  }

  const pid = productIdInput.value ? Number(productIdInput.value) : null;
  const url = pid ? `/api/products/${pid}` : "/api/products";
  const method = pid ? "PUT" : "POST";

  try {
    await apiFetch(url, { method, body: formData });
    setStatus(pid ? "Product updated." : "Product created.", "success");
    clearProductForm();
    await loadProducts();
  } catch (err) {
    setStatus(err.message, "error");
  }
});

productCancelBtn.addEventListener("click", () => {
  clearProductForm();
  setStatus("Product edit cancelled.", "info");
});

productFilterCatid.addEventListener("change", () => {
  renderProductTable();
});

productTbody.addEventListener("click", async (event) => {
  const btn = event.target.closest("button[data-action]");
  if (!btn) {
    return;
  }

  const action = btn.dataset.action;
  const pid = Number(btn.dataset.pid);
  if (!pid) {
    return;
  }

  if (action === "edit") {
    startProductEdit(pid);
    return;
  }

  if (action === "delete") {
    const confirmed = window.confirm(`Delete product #${pid}?`);
    if (!confirmed) {
      return;
    }

    try {
      await apiFetch(`/api/products/${pid}`, { method: "DELETE" });
      setStatus("Product deleted.", "success");
      clearProductForm();
      await loadProducts();
    } catch (err) {
      setStatus(err.message, "error");
    }
  }
});

async function init() {
  try {
    setStatus("Loading admin data...", "info");
    await loadCategories();
    await loadProducts();
    clearCategoryForm();
    clearProductForm();
    setStatus("Admin panel ready.", "success");
  } catch (err) {
    setStatus(err.message, "error");
  }
}

init();
