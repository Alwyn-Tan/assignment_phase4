(function initLoginPage(global) {
  const authUi = global.authUi;
  const utils = global.clientUtils;
  if (!authUi || !utils) {
    throw new Error("auth-ui.js and client-utils.js must be loaded before login.js");
  }

  const form = document.getElementById("login-form");
  const statusEl = document.getElementById("auth-status");
  const emailInput = document.getElementById("login-email");
  const passwordInput = document.getElementById("login-password");

  function setStatus(message, type = "info") {
    statusEl.textContent = message;
    statusEl.className = `auth-status ${type}`;
  }

  emailInput.addEventListener("input", () => {
    emailInput.value = utils.normalizeSingleLineInput(emailInput.value, 254).toLowerCase();
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    setStatus("Signing in...", "info");

    try {
      const payload = await authUi.requestJson("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: emailInput.value,
          password: passwordInput.value,
        }),
      });
      window.location.href = payload.redirectTo || "/";
    } catch (err) {
      setStatus(err.message, "error");
    }
  });
})(window);
