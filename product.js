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

function parsePidFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const pidRaw = params.get("pid");
  if (pidRaw) {
    const pid = Number.parseInt(pidRaw, 10);
    if (Number.isInteger(pid) && pid > 0) {
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
  const pid = Number.parseInt(digits[0], 10);
  return Number.isInteger(pid) && pid > 0 ? pid : null;
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
  document.title = `${product.name} - Future Drinks`;

  categoryTagEl.textContent = product.category_name || "Category";
  productNameEl.textContent = product.name;
  breadcrumbProductEl.textContent = product.name;
  breadcrumbCategoryEl.textContent = product.category_name || "Category";
  breadcrumbCategoryEl.href = `index.html?catid=${product.catid}`;

  productSkuEl.textContent = `PID: ${product.pid} - In Stock`;
  productPriceEl.textContent = Number(product.price).toFixed(2);
  productDescriptionEl.textContent = product.description || "No description.";

  const mainImage = product.image_path || product.thumb_path || "";
  const thumbImage = product.thumb_path || product.image_path || "";

  productMainImageEl.src = mainImage;
  productMainImageEl.alt = `${product.name} image`;
  productThumbImageEl.src = thumbImage;
  productThumbImageEl.alt = `${product.name} thumbnail`;

  if (addToCartBtn) {
    addToCartBtn.disabled = false;
    addToCartBtn.dataset.cartAdd = String(product.pid);
    addToCartBtn.dataset.cartQtySource = "#qty";
  }
  if (buyNowBtn) {
    buyNowBtn.disabled = false;
  }
}

function getPagePid() {
  const pidRaw = addToCartBtn ? addToCartBtn.dataset.cartAdd : "";
  const pid = Number.parseInt(pidRaw, 10);
  return Number.isInteger(pid) && pid > 0 ? pid : null;
}

function getDesiredQuantity() {
  if (!quantityInputEl) {
    return 1;
  }
  const qty = Number.parseInt(quantityInputEl.value, 10);
  if (!Number.isInteger(qty) || qty <= 0) {
    return 1;
  }
  return Math.min(qty, 999);
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

initProductPage();
