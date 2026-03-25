/**
 * Admin shared state + rendering helpers.
 * Event wiring is intentionally kept in admin.js.
 */
(function initAdminCommon(global) {
  const utils = global.clientUtils;
  if (!utils) {
    throw new Error("client-utils.js must be loaded before admin-common.js");
  }

  const {
    normalizeSingleLineInput,
    normalizeMultilineInput,
    sanitizeDisplayText,
    sanitizeUploadImagePath,
    toStrictPositiveInt,
    isValidNoAngleBrackets,
    isValidPrice,
  } = utils;

  const dom = {
    statusEl: document.getElementById("status"),
    categoryForm: document.getElementById("category-form"),
    categoryIdInput: document.getElementById("category-id"),
    categoryNameInput: document.getElementById("category-name"),
    categorySubmitBtn: document.getElementById("category-submit"),
    categoryCancelBtn: document.getElementById("category-cancel"),
    categoryTbody: document.getElementById("category-tbody"),
    productForm: document.getElementById("product-form"),
    productIdInput: document.getElementById("product-id"),
    productCatidSelect: document.getElementById("product-catid"),
    productNameInput: document.getElementById("product-name"),
    productPriceInput: document.getElementById("product-price"),
    productDescInput: document.getElementById("product-description"),
    productImageInput: document.getElementById("product-image"),
    productPreview: document.getElementById("product-preview"),
    productSubmitBtn: document.getElementById("product-submit"),
    productCancelBtn: document.getElementById("product-cancel"),
    productFilterCatid: document.getElementById("product-filter-catid"),
    productTbody: document.getElementById("product-tbody"),
  };

  const state = {
    categories: [],
    products: [],
  };

  const config = {
    maxUploadBytes: 10 * 1024 * 1024,
    allowedImageTypes: new Set(["image/jpeg", "image/png", "image/webp"]),
  };

  function setStatus(message, type = "info") {
    dom.statusEl.textContent = message;
    dom.statusEl.className = `admin-status ${type}`;
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
      if (response.status === 401) {
        window.location.href = "/login";
        throw new Error("Please log in first.");
      }
      if (response.status === 403) {
        window.location.href = "/";
        throw new Error("Admin access is required.");
      }
      const error = payload && payload.error ? payload.error : "Request failed.";
      throw new Error(error);
    }

    return payload;
  }

  function clearCategoryForm() {
    dom.categoryIdInput.value = "";
    dom.categoryForm.reset();
    dom.categoryNameInput.setCustomValidity("");
    dom.categorySubmitBtn.textContent = "Add Category";
  }

  function clearProductForm() {
    dom.productIdInput.value = "";
    dom.productForm.reset();
    dom.productNameInput.setCustomValidity("");
    dom.productPriceInput.setCustomValidity("");
    dom.productDescInput.setCustomValidity("");
    dom.productImageInput.setCustomValidity("");
    dom.productSubmitBtn.textContent = "Add Product";
    dom.productPreview.src = "";
  }

  function createActionButton(action, text) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = action === "delete" ? "button danger small" : "button small";
    btn.dataset.action = action;
    btn.textContent = text;
    return btn;
  }

  function buildCategoryOptions() {
    dom.productCatidSelect.innerHTML = "";
    dom.productFilterCatid.innerHTML = "";

    const allOption = document.createElement("option");
    allOption.value = "";
    allOption.textContent = "All";
    dom.productFilterCatid.appendChild(allOption);

    for (const cat of state.categories) {
      const safeCatid = toStrictPositiveInt(cat.catid);
      if (!safeCatid) {
        continue;
      }
      const safeName = sanitizeDisplayText(cat.name, 80);

      const createOption = document.createElement("option");
      createOption.value = String(safeCatid);
      createOption.textContent = `${safeName} (#${safeCatid})`;
      dom.productCatidSelect.appendChild(createOption);

      const filterOption = document.createElement("option");
      filterOption.value = String(safeCatid);
      filterOption.textContent = `${safeName} (#${safeCatid})`;
      dom.productFilterCatid.appendChild(filterOption);
    }

    if (!state.categories.length) {
      const emptyOption = document.createElement("option");
      emptyOption.value = "";
      emptyOption.textContent = "No categories available";
      dom.productCatidSelect.appendChild(emptyOption);
      dom.productCatidSelect.disabled = true;
      dom.productSubmitBtn.disabled = true;
    } else {
      dom.productCatidSelect.disabled = false;
      dom.productSubmitBtn.disabled = false;
    }
  }

  function renderCategoryTable() {
    dom.categoryTbody.innerHTML = "";

    for (const cat of state.categories) {
      const safeCatid = toStrictPositiveInt(cat.catid);
      if (!safeCatid) {
        continue;
      }

      const tr = document.createElement("tr");
      const idTd = document.createElement("td");
      idTd.textContent = String(safeCatid);

      const nameTd = document.createElement("td");
      nameTd.textContent = sanitizeDisplayText(cat.name, 80);

      const actionTd = document.createElement("td");
      actionTd.className = "action-cell";

      const editBtn = createActionButton("edit", "Edit");
      editBtn.dataset.catid = String(safeCatid);

      const delBtn = createActionButton("delete", "Delete");
      delBtn.dataset.catid = String(safeCatid);

      actionTd.append(editBtn, delBtn);
      tr.append(idTd, nameTd, actionTd);
      dom.categoryTbody.appendChild(tr);
    }
  }

  function renderProductTable() {
    dom.productTbody.innerHTML = "";
    const filteredCatid = toStrictPositiveInt(dom.productFilterCatid.value);
    const rows = filteredCatid
      ? state.products.filter((product) => toStrictPositiveInt(product.catid) === filteredCatid)
      : state.products;

    for (const product of rows) {
      const safePid = toStrictPositiveInt(product.pid);
      const safeCatid = toStrictPositiveInt(product.catid);
      if (!safePid || !safeCatid) {
        continue;
      }

      const tr = document.createElement("tr");

      const pidTd = document.createElement("td");
      pidTd.textContent = String(safePid);

      const nameTd = document.createElement("td");
      nameTd.textContent = sanitizeDisplayText(product.name, 120);

      const catTd = document.createElement("td");
      catTd.textContent = sanitizeDisplayText(product.category_name, 80);

      const priceTd = document.createElement("td");
      priceTd.textContent = `$${Number(product.price).toFixed(2)}`;

      const descTd = document.createElement("td");
      descTd.textContent = sanitizeDisplayText(product.description || "", 4000);

      const imgTd = document.createElement("td");
      const safeThumbPath = sanitizeUploadImagePath(product.thumb_path);
      if (safeThumbPath) {
        const img = document.createElement("img");
        img.src = safeThumbPath;
        img.alt = sanitizeDisplayText(product.name, 120);
        img.className = "thumb-mini";
        imgTd.appendChild(img);
      } else {
        imgTd.textContent = "-";
      }

      const actionTd = document.createElement("td");
      actionTd.className = "action-cell";

      const editBtn = createActionButton("edit", "Edit");
      editBtn.dataset.pid = String(safePid);

      const delBtn = createActionButton("delete", "Delete");
      delBtn.dataset.pid = String(safePid);

      actionTd.append(editBtn, delBtn);
      tr.append(pidTd, nameTd, catTd, priceTd, descTd, imgTd, actionTd);
      dom.productTbody.appendChild(tr);
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
    const cat = state.categories.find((item) => toStrictPositiveInt(item.catid) === catid);
    if (!cat) {
      return;
    }

    dom.categoryIdInput.value = String(catid);
    dom.categoryNameInput.value = normalizeSingleLineInput(cat.name, 80);
    dom.categorySubmitBtn.textContent = "Update Category";
    dom.categoryNameInput.focus();
  }

  function startProductEdit(pid) {
    const product = state.products.find((item) => toStrictPositiveInt(item.pid) === pid);
    if (!product) {
      return;
    }

    const safeCatid = toStrictPositiveInt(product.catid);
    if (!safeCatid) {
      return;
    }

    dom.productIdInput.value = String(pid);
    dom.productCatidSelect.value = String(safeCatid);
    dom.productNameInput.value = normalizeSingleLineInput(product.name, 120);
    dom.productPriceInput.value = Number(product.price).toFixed(2);
    dom.productDescInput.value = normalizeMultilineInput(product.description || "", 4000);
    dom.productPreview.src = sanitizeUploadImagePath(product.thumb_path);
    dom.productImageInput.value = "";
    dom.productSubmitBtn.textContent = "Update Product";
    dom.productNameInput.focus();
  }

  global.adminCommon = Object.freeze({
    dom,
    state,
    config,
    utils: {
      normalizeSingleLineInput,
      normalizeMultilineInput,
      sanitizeUploadImagePath,
      toStrictPositiveInt,
      isValidNoAngleBrackets,
      isValidPrice,
    },
    setStatus,
    apiFetch,
    clearCategoryForm,
    clearProductForm,
    renderProductTable,
    loadCategories,
    loadProducts,
    startCategoryEdit,
    startProductEdit,
  });
})(window);
