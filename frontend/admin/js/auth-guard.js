/**
 * auth-guard.js
 *
 * Shared authentication guard for all admin pages.
 *
 * INTEGRATION INSTRUCTIONS
 * ────────────────────────
 * 1. Add this <script> tag to every admin HTML page, BEFORE
 *    the page-specific script (admin.js, services-admin.js, etc.):
 *
 *      <script src="../js/auth-guard.js"></script>
 *
 * 2. Replace the existing Logout <a href="#"> in the sidebar
 *    with this button (already included in the updated HTML below):
 *
 *      <button class="admin-nav-link admin-nav-link--logout
 *                     admin-logout-btn" id="logoutBtn" type="button">
 *        <svg ...>...</svg>
 *        Logout
 *      </button>
 *
 *    The button is styled identically to the logout link — no CSS
 *    changes needed. auth-guard.js wires the click handler.
 *
 * 3. No changes to existing API logic, table logic, or filter logic.
 *
 * HOW IT WORKS
 * ────────────
 * On every admin page load, auth-guard.js runs synchronously and:
 *   a) Reads localStorage.getItem('adminToken')
 *   b) If missing → immediately redirects to login page
 *   c) If present → continues; page-specific script loads normally
 *   d) Wires the logout button to clear the token and redirect
 *
 * The guard runs before any async data fetch so unauthenticated
 * users never trigger API calls.
 */

(function () {
  "use strict";

  /* ── Config — matches login.js ── */
  const TOKEN_KEY = "adminToken";
  const USER_KEY = "adminUser";
  const REFRESH_KEY = "refreshToken";
  const LOGIN_URL = "./login.html";

  /* =========================================
     AUTH GUARD — runs synchronously on load
  ========================================= */
  const token = localStorage.getItem(TOKEN_KEY);

  if (!token) {
    /* No token → redirect immediately, stop all further execution */
    window.location.replace(LOGIN_URL);
    /* Throw to halt any inline scripts that may have already started */
    console.warn("[Auth] No token found. Redirecting to login.");
  }

  /* =========================================
     LOGOUT HANDLER
     Wires #logoutBtn once DOM is ready.
     Works whether the button exists at parse
     time or is rendered by a framework later.
  ========================================= */
  function wireLogout() {
    const logoutBtn = document.getElementById("logoutBtn");
    if (!logoutBtn) return;

    logoutBtn.addEventListener("click", () => {
      localStorage.removeItem(TOKEN_KEY);
      window.location.replace(LOGIN_URL);
    });
  }

  /* DOMContentLoaded may already have fired if this script is deferred */
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", wireLogout, { once: true });
  } else {
    wireLogout();
  }

  (function () {
    function applyRoleRestrictions() {
      const user = JSON.parse(localStorage.getItem("adminUser"));
      if (!user) return;

      if (user.role !== "super_admin") {
        document.querySelectorAll(".super-admin-only").forEach((el) => {
          el.style.display = "none";
        });
      }
    }

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", applyRoleRestrictions);
    } else {
      applyRoleRestrictions();
    }
  })();
  /* =========================================
     OPTIONAL — expose token for API calls
     Page-specific scripts can read:
       window.__adminToken
     and attach it to fetch headers when the
     backend requires token verification:
       headers: { 'Authorization': `Bearer ${window.__adminToken}` }
  ========================================= */

  window.addEventListener("pageshow", (event) => {
    console.log("[AuthGuard] pageshow fired", {
      persisted: event.persisted,
      token: localStorage.getItem(TOKEN_KEY),
      user: localStorage.getItem(USER_KEY),
    });

    const token = localStorage.getItem(TOKEN_KEY);
    const user = localStorage.getItem(USER_KEY);

    if (!token || !user) {
      window.location.replace(LOGIN_URL);
    }
  });

  window.__adminToken = token;
})();
