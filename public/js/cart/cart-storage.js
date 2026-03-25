/**
 * Cart storage and numeric helpers.
 * Pure helpers live here so controller/view stay small.
 */
(function initCartStorage(global) {
  const utils = global.clientUtils;
  if (!utils) {
    throw new Error("client-utils.js must be loaded before cart-storage.js");
  }

  const { toStrictPositiveInt } = utils;

  const CART_STORAGE_KEY = "future-drinks-cart-v1";
  const CART_MAX_QTY = 999;

  function toPositiveInt(value) {
    return toStrictPositiveInt(value);
  }

  function toQuantity(value) {
    const raw = String(value).trim();
    if (!/^[1-9]\d{0,3}$/.test(raw)) {
      return 0;
    }

    const parsed = Number(raw);
    if (!Number.isSafeInteger(parsed) || parsed <= 0) {
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

  global.cartStorage = Object.freeze({
    CART_MAX_QTY,
    toPositiveInt,
    toQuantity,
    formatMoney,
    loadCartMap,
    saveCartMap,
    mapToEntries,
  });
})(window);
