const categoryLinksEl = document.getElementById("category-links");
const productGridEl = document.getElementById("product-grid");
const breadcrumbCurrentEl = document.getElementById("catalog-current");
const priceRangeInputs = Array.from(
  document.querySelectorAll("input[name='price-range']")
);

let allProducts = [];

function parseCatidFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const raw = params.get("catid");
  if (!raw) {
    return null;
  }
  const parsed = Number.parseInt(raw, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function formatPrice(value) {
  const parsed = Number.parseFloat(value);
  if (!Number.isFinite(parsed)) {
    return "$0.00";
  }
  return `$${parsed.toFixed(2)}`;
}

function setGridMessage(message) {
  productGridEl.innerHTML = "";
  const div = document.createElement("div");
  div.className = "catalog-empty";
  div.textContent = message;
  productGridEl.appendChild(div);
}

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

function createCategoryLink(text, href, isActive) {
  const link = document.createElement("a");
  link.href = href;
  link.textContent = text;
  if (isActive) {
    link.classList.add("active");
  }
  return link;
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

function renderCategories(categories, activeCatid) {
  categoryLinksEl.innerHTML = "";
  categoryLinksEl.appendChild(
    createCategoryLink("Popular Picks", "index.html", !activeCatid)
  );

  for (const category of categories) {
    const href = `index.html?catid=${category.catid}`;
    const isActive = activeCatid === category.catid;
    categoryLinksEl.appendChild(
      createCategoryLink(category.name, href, isActive)
    );
  }

  const activeName = activeCatid
    ? categories.find((item) => item.catid === activeCatid)?.name
    : "Popular Picks";
  breadcrumbCurrentEl.textContent = activeName || "Popular Picks";
}

function createProductCard(product) {
  const article = document.createElement("article");
  article.className = "card";

  const thumbLink = document.createElement("a");
  thumbLink.className = "thumb";
  thumbLink.href = `product.html?pid=${product.pid}`;

  const image = document.createElement("img");
  image.src = product.thumb_path || product.image_path || "";
  image.alt = product.name;
  thumbLink.appendChild(image);

  const body = document.createElement("div");
  body.className = "body";

  const titleRow = document.createElement("div");
  titleRow.className = "title";

  const h2 = document.createElement("h2");
  const titleLink = document.createElement("a");
  titleLink.href = `product.html?pid=${product.pid}`;
  titleLink.textContent = product.name;
  h2.appendChild(titleLink);

  const price = document.createElement("span");
  price.className = "price";
  price.textContent = formatPrice(product.price);

  titleRow.append(h2, price);

  const desc = document.createElement("p");
  desc.textContent = product.description || "No description.";

  const actions = document.createElement("div");
  actions.className = "actions";
  const button = document.createElement("button");
  button.className = "button primary";
  button.type = "button";
  const pid = Number.parseInt(product.pid, 10);
  if (Number.isInteger(pid) && pid > 0) {
    button.dataset.cartAdd = String(pid);
    button.dataset.pid = String(pid);
    bindHomeAddToCart(button, pid);
  }
  button.textContent = "Add to Cart";
  actions.appendChild(button);

  body.append(titleRow, desc, actions);
  article.append(thumbLink, body);
  return article;
}

function renderProducts(products) {
  productGridEl.innerHTML = "";
  if (!products.length) {
    setGridMessage("No products found in this category.");
    return;
  }

  for (const product of products) {
    productGridEl.appendChild(createProductCard(product));
  }
}

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Failed to load data.");
  }
  return response.json();
}

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

for (const input of priceRangeInputs) {
  input.addEventListener("change", () => {
    renderFilteredProducts();
  });
}

initCatalog();
