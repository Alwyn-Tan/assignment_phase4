/**
 * Cart controller.
 * Orchestrates storage, rendering, and user interaction.
 */
(function initCartController(global) {
  const storage = global.cartStorage;
  const view = global.cartView;
  if (!storage) {
    throw new Error("cart-storage.js must be loaded before cart.js");
  }
  if (!view) {
    throw new Error("cart-view.js must be loaded before cart.js");
  }

  const {
    CART_MAX_QTY,
    toPositiveInt,
    toQuantity,
    formatMoney,
    loadCartMap,
    saveCartMap,
    mapToEntries,
  } = storage;

  const {
    buildEmptyCartState,
    buildCartRow,
    findItemPid,
    readButtonQuantity,
    flashAddState,
  } = view;

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
        const err = new Error(response.status === 404
          ? "Product not found."
          : "Failed to load product.");
        err.status = response.status;
        throw err;
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

  async function resolveDisplayItems(entries) {
    const rows = await Promise.all(
      entries.map(async (entry) => {
        try {
          const product = await fetchProduct(entry.pid);
          return { ...entry, product, error: null };
        } catch (err) {
          return { ...entry, product: null, error: err };
        }
      })
    );

    let changed = false;
    for (const row of rows) {
      if (!row.product && row.error && row.error.status === 404) {
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
      const row = buildCartRow(item);
      if (!row) {
        continue;
      }

      itemsEl.appendChild(row);
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

  global.shopCart = {
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
})(window);
