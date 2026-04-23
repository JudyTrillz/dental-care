/* =========================================
   login.js
   Handles: form submit → POST /api/auth/login
            → save token → redirect to dashboard
   No frameworks. Self-contained IIFE.
========================================= */
import { apiFetch } from "./apiClient.js";
import { API_BASE } from "./config.js";

(function () {
  "use strict";

  /* ── Config ── */
  const AUTH_ENDPOINT = `${API_BASE}/api/auth/login`;
  const TOKEN_KEY = "adminToken";
  const DASHBOARD_URL = "index.html"; // relative to /pages/

  /* ── DOM refs ── */
  const form = document.getElementById("loginForm");
  const emailInput = document.getElementById("loginEmail");
  const passwordInput = document.getElementById("loginPassword");
  const submitBtn = document.getElementById("loginSubmit");
  const submitLabel = submitBtn.querySelector(".login-submit-label");
  const submitLoading = submitBtn.querySelector(".login-submit-loading");
  const errorBanner = document.getElementById("loginError");
  const errorText = document.getElementById("loginErrorText");
  const togglePwdBtn = document.getElementById("togglePassword");
  const eyeShow = togglePwdBtn.querySelector(".eye-icon--show");
  const eyeHide = togglePwdBtn.querySelector(".eye-icon--hide");

  /* ── If already logged in, go straight to dashboard ── */
  if (localStorage.getItem(TOKEN_KEY)) {
    window.location.replace(DASHBOARD_URL);
  }

  /* =========================================
     SHOW / HIDE PASSWORD TOGGLE
  ========================================= */
  togglePwdBtn.addEventListener("click", () => {
    const isPassword = passwordInput.type === "password";
    passwordInput.type = isPassword ? "text" : "password";
    togglePwdBtn.setAttribute("aria-pressed", String(isPassword));
    togglePwdBtn.setAttribute(
      "aria-label",
      isPassword ? "Hide password" : "Show password",
    );
    eyeShow.hidden = isPassword;
    eyeHide.hidden = !isPassword;
  });

  /* =========================================
     FORM SUBMIT
  ========================================= */
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearError();

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!email || !password) {
      showError("Please enter your email address and password.");
      if (!email) emailInput.classList.add("is-error");
      if (!password) passwordInput.classList.add("is-error");
      return;
    }

    setLoading(true);

    try {
      const response = await apiFetch(AUTH_ENDPOINT, {
        method: "POST",
        body: { email, password },
      });

      console.log("LOGIN RESPONSE:", response);

      /* =========================
       HANDLE API ERROR
    ========================= */
      if (!response.success) {
        showError(response.message || "Login failed");
        return;
      }

      const { token, refreshToken, user } = response.data;

      if (!token || !refreshToken || !user) {
        showError("Invalid server response. Please try again.");
        return;
      }

      /* =========================
       STORE AUTH STATE (SOURCE OF TRUTH)
    ========================= */
      localStorage.setItem("adminToken", token);
      localStorage.setItem("refreshToken", refreshToken);
      localStorage.setItem("adminUser", JSON.stringify(user));

      submitLabel.textContent = "Success";

      setTimeout(() => {
        window.location.replace(DASHBOARD_URL);
      }, 400);
    } catch (err) {
      console.error("[Login] Error:", err);
      showError("Unable to connect to server. Try again.");
    } finally {
      setLoading(false);
    }
  });

  /* Clear error state when user starts editing */
  [emailInput, passwordInput].forEach((input) => {
    input.addEventListener("input", () => {
      input.classList.remove("is-error");
      if (
        !emailInput.classList.contains("is-error") &&
        !passwordInput.classList.contains("is-error")
      ) {
        clearError();
      }
    });
  });

  /* =========================================
     HELPERS
  ========================================= */
  function setLoading(loading) {
    submitBtn.disabled = loading;
    submitLabel.hidden = loading;
    submitLoading.hidden = !loading;
    submitLoading.setAttribute("aria-hidden", String(!loading));
  }

  function showError(msg) {
    errorText.textContent = msg;
    errorBanner.hidden = false;
    errorBanner.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function clearError() {
    errorBanner.hidden = true;
    errorText.textContent = "";
  }
})();
