const CART_STORAGE_KEY = "future-drinks-cart-v1";
const CART_MAX_QTY = 999;

function toPositiveInt(value) {
  const parsed = Number.parseInt(String(value), 10);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }
  return parsed;
}

function toQuantity(value) {
  const parsed = Number.parseInt(String(value), 10);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return 0;
  }
  return Math.min(parsed, CART_MAX_QTY);
}

function formatMoney(value) {
  const amount = Number.parseFloat(String(value));
  if (!Number.isFinite(amount) || amount < 0) {
    return "$0.00";
  }
  return `$${amount.toFixed(2)}`;
}

function loadCartMap() {
  try {
    const raw = window.localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) {
      return {};
    }
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") {
      return {};
    }

    const normalized = {};
    for (const [pidRaw, qtyRaw] of Object.entries(parsed)) {
      const pid = toPositiveInt(pidRaw);
      const qty = toQuantity(qtyRaw);
      if (pid && qty > 0) {
        normalized[String(pid)] = qty;
      }
    }
    return normalized;
  } catch (err) {
    return {};
  }
}

function saveCartMap(map) {
  window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(map));
}

function mapToEntries(map) {
  return Object.entries(map)
    .map(([pidRaw, qtyRaw]) => ({
      pid: toPositiveInt(pidRaw),
      quantity: toQuantity(qtyRaw),
    }))
    .filter((item) => item.pid && item.quantity > 0)
    .sort((a, b) => a.pid - b.pid);
}

(function initCart() {
  const cartWrap = document.querySelector(".cart");
  if (!cartWrap) {
    return;
  }

  const cartToggle = cartWrap.querySelector("#cart-toggle");
  const countEl = cartWrap.querySelector("#cart-count");
  const itemsEl = cartWrap.querySelector("#cart-items");
  const totalEl = cartWrap.querySelector("#cart-total");
  const productCache = new Map();

  let cartMap = loadCartMap();
  let renderVersion = 0;

  function getEntries() {
    return mapToEntries(cartMap);
  }

  function getTotalQuantity() {
    return getEntries().reduce((sum, item) => sum + item.quantity, 0);
  }

  function setCountBadge() {
    if (countEl) {
      countEl.textContent = String(getTotalQuantity());
    }
  }

  function notifyCartUpdate() {
    document.dispatchEvent(
      new CustomEvent("cart:updated", {
        detail: {
          items: getEntries(),
          totalQuantity: getTotalQuantity(),
        },
      })
    );
  }

  function persist() {
    saveCartMap(cartMap);
    setCountBadge();
  }

  function setQuantity(pid, qty) {
    const safePid = toPositiveInt(pid);
    if (!safePid) {
      return;
    }

    const safeQty = toQuantity(qty);
    if (safeQty <= 0) {
      delete cartMap[String(safePid)];
    } else {
      cartMap[String(safePid)] = safeQty;
    }

    persist();
    queueRender();
  }

  function addItem(pid, qty = 1) {
    const safePid = toPositiveInt(pid);
    if (!safePid) {
      return;
    }
    const increment = toQuantity(qty);
    if (increment <= 0) {
      return;
    }

    const key = String(safePid);
    const existing = toQuantity(cartMap[key]);
    cartMap[key] = Math.min(existing + increment, CART_MAX_QTY);
    persist();
    queueRender();
  }

  function removeItem(pid) {
    setQuantity(pid, 0);
  }

  function clearCart() {
    cartMap = {};
    persist();
    queueRender();
  }

  async function fetchProduct(pid) {
    const safePid = toPositiveInt(pid);
    if (!safePid) {
      throw new Error("Invalid pid.");
    }
    if (productCache.has(safePid)) {
      return productCache.get(safePid);
    }

    const promise = fetch(`/api/products/${safePid}`).then(async (response) => {
      if (!response.ok) {
        throw new Error("Product not found.");
      }
      return response.json();
    });

    productCache.set(safePid, promise);
    try {
      return await promise;
    } catch (err) {
      productCache.delete(safePid);
      throw err;
    }
  }

  function buildEmptyCartState() {
    const div = document.createElement("div");
    div.className = "cart-empty";
    div.textContent = "Your cart is empty.";
    return div;
  }

  function buildCartRow(item) {
    const row = document.createElement("div");
    row.className = "cart-item";
    row.dataset.pid = String(item.product.pid);

    const image = document.createElement("img");
    image.src = item.product.thumb_path || item.product.image_path || "";
    image.alt = item.product.name;

    const meta = document.createElement("div");
    meta.className = "meta";

    const title = document.createElement("strong");
    title.textContent = item.product.name;

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
    qtyInput.value = String(item.quantity);
    qtyInput.setAttribute("aria-label", `${item.product.name} quantity`);
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

  async function resolveDisplayItems(entries) {
    const rows = await Promise.all(
      entries.map(async (entry) => {
        try {
          const product = await fetchProduct(entry.pid);
          return { ...entry, product };
        } catch (err) {
          return { ...entry, product: null };
        }
      })
    );

    let changed = false;
    for (const row of rows) {
      if (!row.product) {
        delete cartMap[String(row.pid)];
        changed = true;
      }
    }
    if (changed) {
      persist();
    }

    return rows.filter((row) => row.product);
  }

  async function renderCart() {
    const version = ++renderVersion;
    const entries = getEntries();
    setCountBadge();

    if (!itemsEl || !totalEl) {
      notifyCartUpdate();
      return;
    }

    if (!entries.length) {
      itemsEl.innerHTML = "";
      itemsEl.appendChild(buildEmptyCartState());
      totalEl.textContent = "$0.00";
      notifyCartUpdate();
      return;
    }

    const displayItems = await resolveDisplayItems(entries);
    if (version !== renderVersion) {
      return;
    }

    if (!displayItems.length) {
      itemsEl.innerHTML = "";
      itemsEl.appendChild(buildEmptyCartState());
      totalEl.textContent = "$0.00";
      notifyCartUpdate();
      return;
    }

    itemsEl.innerHTML = "";
    let total = 0;
    for (const item of displayItems) {
      itemsEl.appendChild(buildCartRow(item));
      const price = Number.parseFloat(item.product.price);
      total += (Number.isFinite(price) ? price : 0) * item.quantity;
    }
    totalEl.textContent = formatMoney(total);
    notifyCartUpdate();
  }

  function queueRender() {
    renderCart().catch((err) => {
      console.error("Failed to render cart:", err);
    });
  }

  function findItemPid(target) {
    const row = target.closest(".cart-item");
    if (!row) {
      return null;
    }
    return toPositiveInt(row.dataset.pid);
  }

  if (itemsEl) {
    itemsEl.addEventListener("click", (event) => {
      const button = event.target.closest("button[data-cart-action]");
      if (!button) {
        return;
      }
      const pid = findItemPid(button);
      if (!pid) {
        return;
      }

      const current = toQuantity(cartMap[String(pid)]);
      const action = button.dataset.cartAction;
      if (action === "increment") {
        setQuantity(pid, current + 1);
      } else if (action === "decrement") {
        setQuantity(pid, current - 1);
      } else if (action === "remove") {
        removeItem(pid);
      }
    });

    itemsEl.addEventListener("change", (event) => {
      const input = event.target.closest("input[data-cart-input='quantity']");
      if (!input) {
        return;
      }
      const pid = findItemPid(input);
      if (!pid) {
        return;
      }
      setQuantity(pid, input.value);
    });
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

  document.addEventListener("click", (event) => {
    const addBtn = event.target.closest("[data-cart-add]");
    if (!addBtn) {
      return;
    }

    const pid = toPositiveInt(addBtn.dataset.cartAdd || addBtn.dataset.pid);
    if (!pid) {
      return;
    }

    const qty = readButtonQuantity(addBtn);
    addItem(pid, qty);
    flashAddState(addBtn);
  });

  window.shopCart = {
    add(pid, qty = 1) {
      addItem(pid, qty);
    },
    set(pid, qty) {
      setQuantity(pid, qty);
    },
    remove(pid) {
      removeItem(pid);
    },
    clear() {
      clearCart();
    },
    getItems() {
      return getEntries();
    },
    getTotalQuantity() {
      return getTotalQuantity();
    },
    refresh() {
      queueRender();
    },
    openPanel() {
      if (cartToggle) {
        cartToggle.checked = true;
      }
    },
  };

  queueRender();
})();
