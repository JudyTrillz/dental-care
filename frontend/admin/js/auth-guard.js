(function () {
  "use strict";

  const TOKEN_KEY = "adminToken";
  const USER_KEY = "adminUser";
  const LOGIN_URL = "./login.html";

  const token = localStorage.getItem(TOKEN_KEY);
  const user = JSON.parse(localStorage.getItem(USER_KEY));

  // HARD AUTH CHECK (runs before anything else)
  if (!token || !user) {
    window.location.replace(LOGIN_URL);
    return;
  }

  // ROLE-BASED PAGE ACCESS CONTROL
  const PAGE_RULES = {
    "index.html": ["admin", "super_admin"],
    "services.html": ["super_admin"],
    "dentists.html": ["super_admin"],
    "admins.html": ["super_admin"],
  };

  const currentPage = window.location.pathname.split("/").pop();
  const allowedRoles = PAGE_RULES[currentPage];

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    window.location.replace("index.html");
    return;
  }

  // EXPOSE GLOBALS
  window.__adminToken = token;
  window.currentUser = user;

  // LOGOUT HANDLER
  function wireLogout() {
    const btn = document.getElementById("logoutBtn");
    if (!btn) return;

    btn.addEventListener("click", () => {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      window.location.replace(LOGIN_URL);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", wireLogout);
  } else {
    wireLogout();
  }
})();
