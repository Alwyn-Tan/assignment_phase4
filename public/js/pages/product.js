/**
 * Product detail page controller.
 * Shared sanitizers are centralized in client-utils.js.
 */
const utils = window.clientUtils;
if (!utils) {
  throw new Error("client-utils.js must be loaded before product.js");
}

const {
  toStrictPositiveInt,
  sanitizeSingleLineText,
  sanitizeMultilineText,
  sanitizeUploadImagePath,
} = utils;

const breadcrumbCategoryEl = document.getElementById("breadcrumb-category");
const breadcrumbProductEl = document.getElementById("breadcrumb-product");
const categoryTagEl = document.getElementById("product-category");
const productNameEl = document.getElementById("product-name");
const productSkuEl = document.getElementById("product-sku");
const productPriceEl = document.getElementById("product-price");
const productDescriptionEl = document.getElementById("product-description");
const productMainImageEl = document.getElementById("product-main-image");
const productThumbImageEl = document.getElementById("product-thumb-image");
const quantityInputEl = document.getElementById("qty");
const addToCartBtn = document.getElementById("product-add-to-cart");
const buyNowBtn = document.getElementById("product-buy-now");
const searchInputEl = document.querySelector(".search input[name='q']");

function parsePidFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const pidRaw = params.get("pid");
  if (pidRaw) {
    const pid = toStrictPositiveInt(pidRaw);
    if (pid) {
      return pid;
    }
  }

  const skuRaw = params.get("sku");
  if (!skuRaw) {
    return null;
  }
  const digits = skuRaw.match(/\d+/);
  if (!digits) {
    return null;
  }
  return toStrictPositiveInt(digits[0]);
}

function setErrorState(message) {
  productNameEl.textContent = "Product Not Found";
  categoryTagEl.textContent = "Unavailable";
  breadcrumbProductEl.textContent = "Not Found";
  productDescriptionEl.textContent = message;
  productPriceEl.textContent = "0.00";
  productSkuEl.textContent = "PID: N/A";
  productMainImageEl.src = "";
  productThumbImageEl.src = "";
  if (addToCartBtn) {
    addToCartBtn.disabled = true;
    addToCartBtn.removeAttribute("data-cart-add");
  }
  if (buyNowBtn) {
    buyNowBtn.disabled = true;
  }
}

function applyProduct(product) {
  const safePid = toStrictPositiveInt(product.pid);
  const safeCatid = toStrictPositiveInt(product.catid);
  if (!safePid || !safeCatid) {
    setErrorState("Invalid product data.");
    return;
  }

  const safeName = sanitizeSingleLineText(product.name, 120) || "Product";
  const safeCategoryName = sanitizeSingleLineText(product.category_name, 80) || "Category";
  const safeDescription = sanitizeMultilineText(product.description || "", 4000);

  document.title = `${safeName} - Future Drinks`;

  categoryTagEl.textContent = safeCategoryName;
  productNameEl.textContent = safeName;
  breadcrumbProductEl.textContent = safeName;
  breadcrumbCategoryEl.textContent = safeCategoryName;
  breadcrumbCategoryEl.href = `index.html?catid=${safeCatid}`;

  productSkuEl.textContent = `PID: ${safePid} - In Stock`;
  productPriceEl.textContent = Number(product.price).toFixed(2);
  productDescriptionEl.textContent = safeDescription || "No description.";

  const safeMainImage = sanitizeUploadImagePath(product.image_path);
  const safeThumbImage = sanitizeUploadImagePath(product.thumb_path);
  const mainImage = safeMainImage || safeThumbImage;
  const thumbImage = safeThumbImage || safeMainImage;

  productMainImageEl.src = mainImage;
  productMainImageEl.alt = `${safeName} image`;
  productThumbImageEl.src = thumbImage;
  productThumbImageEl.alt = `${safeName} thumbnail`;

  if (addToCartBtn) {
    addToCartBtn.disabled = false;
    addToCartBtn.dataset.cartAdd = String(safePid);
    addToCartBtn.dataset.cartQtySource = "#qty";
  }
  if (buyNowBtn) {
    buyNowBtn.disabled = false;
  }
}

function getPagePid() {
  const pidRaw = addToCartBtn ? addToCartBtn.dataset.cartAdd : "";
  return toStrictPositiveInt(pidRaw);
}

function getDesiredQuantity() {
  if (!quantityInputEl) {
    return 1;
  }
  const qty = Number.parseInt(String(quantityInputEl.value).trim(), 10);
  if (!Number.isInteger(qty) || qty <= 0 || qty > 999) {
    quantityInputEl.value = "1";
    return 1;
  }
  return qty;
}

async function initProductPage() {
  const pid = parsePidFromUrl();
  if (!pid) {
    setErrorState("Invalid product id.");
    return;
  }

  try {
    const response = await fetch(`/api/products/${pid}`);
    if (!response.ok) {
      throw new Error("Product not found.");
    }
    const product = await response.json();
    applyProduct(product);
  } catch (err) {
    setErrorState("Unable to load product details.");
  }
}

if (buyNowBtn) {
  buyNowBtn.addEventListener("click", () => {
    const pid = getPagePid();
    if (!pid) {
      return;
    }
    const qty = getDesiredQuantity();
    if (window.shopCart && typeof window.shopCart.add === "function") {
      window.shopCart.add(pid, qty);
      if (typeof window.shopCart.openPanel === "function") {
        window.shopCart.openPanel();
      }
    }
  });
}

if (quantityInputEl) {
  quantityInputEl.addEventListener("input", () => {
    const qty = Number.parseInt(String(quantityInputEl.value).trim(), 10);
    if (!Number.isInteger(qty) || qty <= 0) {
      quantityInputEl.value = "1";
      return;
    }
    quantityInputEl.value = String(Math.min(qty, 999));
  });
}

if (searchInputEl) {
  searchInputEl.addEventListener("input", () => {
    searchInputEl.value = sanitizeSingleLineText(searchInputEl.value, 60);
  });
}

initProductPage();
