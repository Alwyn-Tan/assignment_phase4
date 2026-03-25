(function initRegisterPage(global) {
  const authUi = global.authUi;
  const utils = global.clientUtils;
  if (!authUi || !utils) {
    throw new Error("auth-ui.js and client-utils.js must be loaded before register.js");
  }

  const form = document.getElementById("register-form");
  const statusEl = document.getElementById("auth-status");
  const displayNameInput = document.getElementById("register-display-name");
  const emailInput = document.getElementById("register-email");
  const passwordInput = document.getElementById("register-password");
  const confirmPasswordInput = document.getElementById("register-confirm-password");

  function setStatus(message, type = "info") {
    statusEl.textContent = message;
    statusEl.className = `auth-status ${type}`;
  }

  displayNameInput.addEventListener("input", () => {
    displayNameInput.value = utils.normalizeSingleLineInput(displayNameInput.value, 80);
  });

  emailInput.addEventListener("input", () => {
    emailInput.value = utils.normalizeSingleLineInput(emailInput.value, 254).toLowerCase();
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    setStatus("Creating account...", "info");

    try {
      const payload = await authUi.requestJson("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          display_name: displayNameInput.value,
          email: emailInput.value,
          password: passwordInput.value,
          confirm_password: confirmPasswordInput.value,
        }),
      });
      window.location.href = payload.redirectTo || "/";
    } catch (err) {
      setStatus(err.message, "error");
    }
  });
})(window);
