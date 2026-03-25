(function initChangePasswordPage(global) {
  const authUi = global.authUi;
  if (!authUi) {
    throw new Error("auth-ui.js must be loaded before change-password.js");
  }

  const form = document.getElementById("change-password-form");
  const statusEl = document.getElementById("auth-status");
  const currentPasswordInput = document.getElementById("current-password");
  const newPasswordInput = document.getElementById("new-password");
  const confirmPasswordInput = document.getElementById("confirm-password");

  function setStatus(message, type = "info") {
    statusEl.textContent = message;
    statusEl.className = `auth-status ${type}`;
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    setStatus("Updating password...", "info");

    try {
      const payload = await authUi.requestJson("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          current_password: currentPasswordInput.value,
          new_password: newPasswordInput.value,
          confirm_password: confirmPasswordInput.value,
        }),
      });
      window.location.href = payload.redirectTo || "/login";
    } catch (err) {
      setStatus(err.message, "error");
    }
  });
})(window);
