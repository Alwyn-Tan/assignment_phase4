/**
 * Admin event handlers.
 * Core state/render helpers are provided by admin-common.js.
 */
(function initAdminPage(global) {
  const admin = global.adminCommon;
  if (!admin) {
    throw new Error("admin-common.js must be loaded before admin.js");
  }

  const {
    dom,
    state,
    config,
    utils,
    setStatus,
    apiFetch,
    clearCategoryForm,
    clearProductForm,
    renderProductTable,
    loadCategories,
    loadProducts,
    startCategoryEdit,
    startProductEdit,
  } = admin;

  const {
    normalizeSingleLineInput,
    normalizeMultilineInput,
    toStrictPositiveInt,
    isValidNoAngleBrackets,
    isValidPrice,
  } = utils;

  dom.categoryNameInput.addEventListener("input", () => {
    dom.categoryNameInput.value = normalizeSingleLineInput(dom.categoryNameInput.value, 80);
    dom.categoryNameInput.setCustomValidity("");
  });

  dom.productNameInput.addEventListener("input", () => {
    dom.productNameInput.value = normalizeSingleLineInput(dom.productNameInput.value, 120);
    dom.productNameInput.setCustomValidity("");
  });

  dom.productDescInput.addEventListener("input", () => {
    dom.productDescInput.value = normalizeMultilineInput(dom.productDescInput.value, 4000);
    dom.productDescInput.setCustomValidity("");
  });

  dom.productPriceInput.addEventListener("input", () => {
    dom.productPriceInput.setCustomValidity("");
  });

  dom.productImageInput.addEventListener("change", () => {
    dom.productImageInput.setCustomValidity("");
    const file = dom.productImageInput.files[0];
    if (!file) {
      return;
    }

    if (!config.allowedImageTypes.has(file.type)) {
      dom.productImageInput.value = "";
      dom.productImageInput.setCustomValidity("Only jpg, png, and webp files are allowed.");
      dom.productImageInput.reportValidity();
      setStatus("Only jpg, png, and webp files are allowed.", "error");
      return;
    }

    if (file.size > config.maxUploadBytes) {
      dom.productImageInput.value = "";
      dom.productImageInput.setCustomValidity("Image is too large (max 10MB).");
      dom.productImageInput.reportValidity();
      setStatus("Image is too large (max 10MB).", "error");
    }
  });

  dom.categoryForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const name = normalizeSingleLineInput(dom.categoryNameInput.value, 80);
    dom.categoryNameInput.value = name;

    if (!isValidNoAngleBrackets(name, 1, 80)) {
      dom.categoryNameInput.setCustomValidity(
        "Category name must be 1-80 characters and cannot contain angle brackets."
      );
      dom.categoryNameInput.reportValidity();
      setStatus("Category name must be 1-80 characters and cannot contain angle brackets.", "error");
      return;
    }
    dom.categoryNameInput.setCustomValidity("");

    try {
      const catid = toStrictPositiveInt(dom.categoryIdInput.value);
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

  dom.categoryCancelBtn.addEventListener("click", () => {
    clearCategoryForm();
    setStatus("Category edit cancelled.", "info");
  });

  dom.categoryTbody.addEventListener("click", async (event) => {
    const btn = event.target.closest("button[data-action]");
    if (!btn) {
      return;
    }

    const action = btn.dataset.action;
    const catid = toStrictPositiveInt(btn.dataset.catid);
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

  dom.productForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!state.categories.length) {
      setStatus("Create at least one category before adding products.", "error");
      return;
    }

    const catid = toStrictPositiveInt(dom.productCatidSelect.value);
    const name = normalizeSingleLineInput(dom.productNameInput.value, 120);
    const priceRaw = String(dom.productPriceInput.value || "").trim();
    const description = normalizeMultilineInput(dom.productDescInput.value, 4000);
    const imageFile = dom.productImageInput.files[0];

    dom.productNameInput.value = name;
    dom.productDescInput.value = description;

    if (!catid) {
      setStatus("Please select a valid category.", "error");
      return;
    }

    if (!isValidNoAngleBrackets(name, 1, 120)) {
      dom.productNameInput.setCustomValidity(
        "Product name must be 1-120 characters and cannot contain angle brackets."
      );
      dom.productNameInput.reportValidity();
      setStatus("Product name must be 1-120 characters and cannot contain angle brackets.", "error");
      return;
    }
    dom.productNameInput.setCustomValidity("");

    if (!isValidPrice(priceRaw)) {
      dom.productPriceInput.setCustomValidity("Enter a valid price (up to 2 decimal places).");
      dom.productPriceInput.reportValidity();
      setStatus("Price must be a non-negative number with up to 2 decimal places.", "error");
      return;
    }
    dom.productPriceInput.setCustomValidity("");

    if (/[<>]/.test(description)) {
      dom.productDescInput.setCustomValidity("Description cannot contain angle brackets.");
      dom.productDescInput.reportValidity();
      setStatus("Description cannot contain angle brackets.", "error");
      return;
    }
    dom.productDescInput.setCustomValidity("");

    if (imageFile) {
      if (!config.allowedImageTypes.has(imageFile.type)) {
        dom.productImageInput.value = "";
        setStatus("Only jpg, png, and webp files are allowed.", "error");
        return;
      }
      if (imageFile.size > config.maxUploadBytes) {
        dom.productImageInput.value = "";
        setStatus("Image is too large (max 10MB).", "error");
        return;
      }
    }

    const formData = new FormData();
    formData.append("catid", String(catid));
    formData.append("name", name);
    formData.append("price", priceRaw);
    formData.append("description", description);
    if (imageFile) {
      formData.append("image", imageFile);
    }

    const pid = toStrictPositiveInt(dom.productIdInput.value);
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

  dom.productCancelBtn.addEventListener("click", () => {
    clearProductForm();
    setStatus("Product edit cancelled.", "info");
  });

  dom.productFilterCatid.addEventListener("change", () => {
    renderProductTable();
  });

  dom.productTbody.addEventListener("click", async (event) => {
    const btn = event.target.closest("button[data-action]");
    if (!btn) {
      return;
    }

    const action = btn.dataset.action;
    const pid = toStrictPositiveInt(btn.dataset.pid);
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
})(window);
