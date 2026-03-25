/**
 * Cart UI-only rendering helpers.
 * Keeps DOM construction separate from state transitions.
 */
(function initCartView(global) {
  const utils = global.clientUtils;
  const storage = global.cartStorage;
  if (!utils) {
    throw new Error("client-utils.js must be loaded before cart-view.js");
  }
  if (!storage) {
    throw new Error("cart-storage.js must be loaded before cart-view.js");
  }

  const { sanitizeMultilineText, sanitizeUploadImagePath } = utils;
  const { CART_MAX_QTY, toPositiveInt, toQuantity, formatMoney } = storage;

  function buildEmptyCartState() {
    const div = document.createElement("div");
    div.className = "cart-empty";
    div.textContent = "Your cart is empty.";
    return div;
  }

  function buildCartRow(item) {
    const safePid = toPositiveInt(item.product.pid);
    if (!safePid) {
      return null;
    }

    const safeName = sanitizeMultilineText(item.product.name, 120) || "Product";
    const safeThumbPath = sanitizeUploadImagePath(item.product.thumb_path);
    const safeOriginalPath = sanitizeUploadImagePath(item.product.image_path);

    const row = document.createElement("div");
    row.className = "cart-item";
    row.dataset.pid = String(safePid);

    const image = document.createElement("img");
    image.src = safeThumbPath || safeOriginalPath;
    image.alt = safeName;

    const meta = document.createElement("div");
    meta.className = "meta";

    const title = document.createElement("strong");
    title.textContent = safeName;

    const price = document.createElement("small");
    price.textContent = `${formatMoney(item.product.price)} each`;

    const quantityWrap = document.createElement("div");
    quantityWrap.className = "cart-qty";

    const decBtn = document.createElement("button");
    decBtn.type = "button";
    decBtn.className = "cart-qty-btn";
    decBtn.dataset.cartAction = "decrement";
    decBtn.textContent = "-";
    decBtn.setAttribute("aria-label", "Decrease quantity");

    const qtyInput = document.createElement("input");
    qtyInput.type = "number";
    qtyInput.min = "1";
    qtyInput.max = String(CART_MAX_QTY);
    qtyInput.step = "1";
    qtyInput.required = true;
    qtyInput.inputMode = "numeric";
    qtyInput.value = String(item.quantity);
    qtyInput.setAttribute("aria-label", `${safeName} quantity`);
    qtyInput.dataset.cartInput = "quantity";

    const incBtn = document.createElement("button");
    incBtn.type = "button";
    incBtn.className = "cart-qty-btn";
    incBtn.dataset.cartAction = "increment";
    incBtn.textContent = "+";
    incBtn.setAttribute("aria-label", "Increase quantity");

    quantityWrap.append(decBtn, qtyInput, incBtn);

    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.className = "cart-remove-btn";
    removeBtn.dataset.cartAction = "remove";
    removeBtn.textContent = "Remove";

    meta.append(title, price, quantityWrap, removeBtn);
    row.append(image, meta);
    return row;
  }

  function findItemPid(target) {
    const row = target.closest(".cart-item");
    if (!row) {
      return null;
    }
    return toPositiveInt(row.dataset.pid);
  }

  function readButtonQuantity(button) {
    const selector = button.dataset.cartQtySource;
    if (!selector) {
      return 1;
    }

    const input = document.querySelector(selector);
    if (!input) {
      return 1;
    }

    const qty = toQuantity(input.value);
    return qty > 0 ? qty : 1;
  }

  function flashAddState(button) {
    const originalText = button.textContent;
    button.textContent = "Added";
    button.disabled = true;
    window.setTimeout(() => {
      button.textContent = originalText;
      button.disabled = false;
    }, 650);
  }

  global.cartView = Object.freeze({
    buildEmptyCartState,
    buildCartRow,
    findItemPid,
    readButtonQuantity,
    flashAddState,
  });
})(window);
