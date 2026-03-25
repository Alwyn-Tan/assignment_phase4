/**
 * Shop home page controller.
 * Business logic only; shared sanitizers come from client-utils.js.
 */
const utils = window.clientUtils;
if (!utils) {
  throw new Error("client-utils.js must be loaded before index.js");
}

const {
  toStrictPositiveInt,
  sanitizeSingleLineText,
  sanitizeMultilineText,
  sanitizeUploadImagePath,
} = utils;

const categoryLinksEl = document.getElementById("category-links");
const productGridEl = document.getElementById("product-grid");
const breadcrumbCurrentEl = document.getElementById("catalog-current");
const priceRangeInputs = Array.from(
  document.querySelectorAll("input[name='price-range']")
);
const searchInputEl = document.querySelector(".search input[name='q']");

let allProducts = [];

// Read the category filter from the URL so the page can render deep-linked views.
function parseCatidFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const raw = params.get("catid");
  if (!raw) {
    return null;
  }
  return toStrictPositiveInt(raw);
}

function formatPrice(value) {
  const parsed = Number.parseFloat(value);
  if (!Number.isFinite(parsed)) {
    return "$0.00";
  }
  return `$${parsed.toFixed(2)}`;
}

// Replace the product grid with a single status/empty-state message.
function setGridMessage(message) {
  productGridEl.innerHTML = "";
  const div = document.createElement("div");
  div.className = "catalog-empty";
  div.textContent = message;
  productGridEl.appendChild(div);
}

// Convert price-like values from the API into usable numbers for filtering.
function parsePriceNumber(value) {
  const parsed = Number.parseFloat(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return null;
  }
  return parsed;
}

function getSelectedPriceRanges() {
  return priceRangeInputs.filter((input) => input.checked).map((input) => input.value);
}

// Keep the UI filter values and the comparison logic in one place.
function matchesPriceRange(price, range) {
  if (range === "0-20") {
    return price <= 20;
  }
  if (range === "20-35") {
    return price > 20 && price <= 35;
  }
  if (range === "35+") {
    return price > 35;
  }
  return false;
}

// Apply the currently selected price filters to the in-memory product list.
function getFilteredProducts(products) {
  const selectedRanges = getSelectedPriceRanges();
  if (!selectedRanges.length) {
    return products;
  }

  return products.filter((product) => {
    const price = parsePriceNumber(product.price);
    if (price === null) {
      return false;
    }
    return selectedRanges.some((range) => matchesPriceRange(price, range));
  });
}

function renderFilteredProducts() {
  renderProducts(getFilteredProducts(allProducts));
}

// Build category anchors with the same sanitization rules as the rest of the page.
function createCategoryLink(text, href, isActive) {
  const link = document.createElement("a");
  link.href = href;
  link.textContent = sanitizeSingleLineText(text, 80);
  if (isActive) {
    link.classList.add("active");
  }
  return link;
}

// Provide quick visual feedback after adding an item without requiring a full rerender.
function flashAddState(button) {
  const originalText = button.textContent;
  button.textContent = "Added";
  button.disabled = true;
  window.setTimeout(() => {
    button.textContent = originalText;
    button.disabled = false;
  }, 650);
}

function bindHomeAddToCart(button, pid) {
  button.addEventListener("click", (event) => {
    // Handle home-page add-to-cart directly as a fallback path.
    event.preventDefault();
    event.stopPropagation();

    if (!window.shopCart || typeof window.shopCart.add !== "function") {
      return;
    }

    window.shopCart.add(pid, 1);
    if (typeof window.shopCart.openPanel === "function") {
      window.shopCart.openPanel();
    }
    flashAddState(button);
  });
}

// Render the category navigation and keep the breadcrumb in sync with the active filter.
function renderCategories(categories, activeCatid) {
  categoryLinksEl.innerHTML = "";
  categoryLinksEl.appendChild(
    createCategoryLink("Popular Picks", "index.html", !activeCatid)
  );

  for (const category of categories) {
    const catid = toStrictPositiveInt(category.catid);
    if (!catid) {
      continue;
    }
    const href = `index.html?catid=${catid}`;
    const isActive = activeCatid === catid;
    categoryLinksEl.appendChild(
      createCategoryLink(category.name, href, isActive)
    );
  }

  const activeName = activeCatid
    ? categories.find((item) => toStrictPositiveInt(item.catid) === activeCatid)?.name
    : "Popular Picks";
  breadcrumbCurrentEl.textContent = sanitizeSingleLineText(
    activeName || "Popular Picks",
    80
  );
}

// Create a sanitized product card entirely with DOM APIs to avoid injecting raw HTML.
function createProductCard(product) {
  const article = document.createElement("article");
  article.className = "card";
  const safePid = toStrictPositiveInt(product.pid);
  if (!safePid) {
    return null;
  }
  const safeName = sanitizeSingleLineText(product.name, 120) || "Unnamed Product";
  const safeDescription = sanitizeMultilineText(product.description || "", 4000);
  const safeThumbPath = sanitizeUploadImagePath(product.thumb_path);
  const safeOriginalPath = sanitizeUploadImagePath(product.image_path);

  const thumbLink = document.createElement("a");
  thumbLink.className = "thumb";
  thumbLink.href = `product.html?pid=${safePid}`;

  const image = document.createElement("img");
  image.src = safeThumbPath || safeOriginalPath;
  image.alt = safeName;
  thumbLink.appendChild(image);

  const body = document.createElement("div");
  body.className = "body";

  const titleRow = document.createElement("div");
  titleRow.className = "title";

  const h2 = document.createElement("h2");
  const titleLink = document.createElement("a");
  titleLink.href = `product.html?pid=${safePid}`;
  titleLink.textContent = safeName;
  h2.appendChild(titleLink);

  const price = document.createElement("span");
  price.className = "price";
  price.textContent = formatPrice(product.price);

  titleRow.append(h2, price);

  const desc = document.createElement("p");
  desc.textContent = safeDescription || "No description.";

  const actions = document.createElement("div");
  actions.className = "actions";
  const button = document.createElement("button");
  button.className = "button primary";
  button.type = "button";
  button.dataset.cartAdd = String(safePid);
  button.dataset.pid = String(safePid);
  bindHomeAddToCart(button, safePid);
  button.textContent = "Add to Cart";
  actions.appendChild(button);

  body.append(titleRow, desc, actions);
  article.append(thumbLink, body);
  return article;
}

// Rebuild the visible product grid from the current dataset.
function renderProducts(products) {
  productGridEl.innerHTML = "";
  if (!products.length) {
    setGridMessage("No products found in this category.");
    return;
  }

  for (const product of products) {
    const card = createProductCard(product);
    if (card) {
      productGridEl.appendChild(card);
    }
  }
}

// Centralize fetch error handling so category and product requests behave consistently.
async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Failed to load data.");
  }
  return response.json();
}

// Initialize categories first, then load products for the selected category.
async function initCatalog() {
  const catid = parseCatidFromUrl();

  try {
    const categories = await fetchJson("/api/categories");
    renderCategories(categories, catid);
  } catch (err) {
    categoryLinksEl.innerHTML = "";
    categoryLinksEl.appendChild(
      createCategoryLink("Popular Picks", "index.html", !catid)
    );
    breadcrumbCurrentEl.textContent = "Popular Picks";
  }

  try {
    const apiUrl = catid ? `/api/products?catid=${catid}` : "/api/products";
    const products = await fetchJson(apiUrl);
    allProducts = Array.isArray(products) ? products : [];
    renderFilteredProducts();
  } catch (err) {
    allProducts = [];
    setGridMessage("Cannot load products right now.");
  }
}

// Price filters operate entirely on the already loaded product list.
for (const input of priceRangeInputs) {
  input.addEventListener("change", () => {
    renderFilteredProducts();
  });
}

if (searchInputEl) {
  searchInputEl.addEventListener("input", () => {
    // Keep the home-page search box sanitized even before the query is submitted elsewhere.
    searchInputEl.value = sanitizeSingleLineText(searchInputEl.value, 60);
  });
}

// Kick off the initial page render once the script has been loaded.
initCatalog();
