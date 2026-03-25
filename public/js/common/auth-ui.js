(function initAuthUi(global) {
  const userNodes = Array.from(document.querySelectorAll("[data-auth-user]"));
  const guestOnlyNodes = Array.from(document.querySelectorAll("[data-auth-guest-only]"));
  const userOnlyNodes = Array.from(document.querySelectorAll("[data-auth-user-only]"));
  const adminOnlyNodes = Array.from(document.querySelectorAll("[data-auth-admin-only]"));
  const logoutNodes = Array.from(document.querySelectorAll("[data-auth-logout]"));

  function showNodes(nodes, visible) {
    for (const node of nodes) {
      node.hidden = !visible;
    }
  }

  async function requestJson(url, options = {}) {
    const response = await fetch(url, options);
    let payload = null;
    try {
      payload = await response.json();
    } catch (err) {
      payload = null;
    }

    if (!response.ok) {
      throw new Error(payload && payload.error ? payload.error : "Request failed.");
    }

    return payload;
  }

  function applyAuthState(payload) {
    const authenticated = Boolean(payload && payload.authenticated);
    const user = payload && payload.user ? payload.user : null;
    const displayName = authenticated && user && user.display_name
      ? user.display_name
      : "guest";

    for (const node of userNodes) {
      node.textContent = displayName;
    }

    showNodes(guestOnlyNodes, !authenticated);
    showNodes(userOnlyNodes, authenticated);
    showNodes(adminOnlyNodes, Boolean(authenticated && user && user.is_admin));
    showNodes(logoutNodes, authenticated);
  }

  async function loadAuthState() {
    try {
      const payload = await requestJson("/api/auth/me");
      applyAuthState(payload);
      return payload;
    } catch (err) {
      applyAuthState({ authenticated: false, user: null });
      return { authenticated: false, user: null };
    }
  }

  for (const button of logoutNodes) {
    button.addEventListener("click", async () => {
      button.disabled = true;
      try {
        const payload = await requestJson("/api/auth/logout", { method: "POST" });
        window.location.href = payload.redirectTo || "/login";
      } catch (err) {
        button.disabled = false;
        window.alert(err.message);
      }
    });
  }

  global.authUi = Object.freeze({
    loadAuthState,
    requestJson,
  });

  loadAuthState();
})(window);
