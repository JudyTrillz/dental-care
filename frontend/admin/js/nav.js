import { PAGE_PERMISSIONS, NAV_ITEMS } from "./permissions.js";

function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem("adminUser"));
  } catch (e) {
    return null;
  }
}

function isAllowed(page, role) {
  const allowedRoles = PAGE_PERMISSIONS[page] || [];
  return allowedRoles.includes(role);
}

function renderAdminNav() {
  const user = getCurrentUser();
  const navContainer = document.querySelector("#adminNavLinks");

  if (!navContainer) {
    console.warn("[Nav] Missing #adminNavLinks container");
    return;
  }

  if (!user) {
    console.warn("[Nav] No user found for nav render");
    return;
  }

  const currentPage = window.location.pathname.split("/").pop();

  const allowedNavItems = NAV_ITEMS.filter((item) => isAllowed(item.page, user.role));

  if (!allowedNavItems.length) {
    console.warn("[Nav] No nav items allowed for role:", user.role);
  }

  const navMarkup = allowedNavItems
    .map((item) => {
      const isActive = item.href === currentPage;

      return `
        <li class="admin-nav-item ${isActive ? "active" : ""}">
          <a
            href="${item.href}"
            class="admin-nav-link"
            ${isActive ? 'aria-current="page"' : ""}
          >
            ${item.icon || ""}
            <span>${item.label}</span>
          </a>
        </li>
      `;
    })
    .join("");

  const logoutItem = `
    <li class="admin-nav-item admin-nav-item--logout">
      <a href="#" id="logoutBtn" class="admin-nav-link admin-nav-link--logout">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <path d="M10 17l1 1 4-4" />
          <path d="M4 4h11a2 2 0 012 2v3" />
          <path d="M15 13v7a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2h6" />
          <path d="M21 12H11" />
          <path d="M18 9l3 3-3 3" />
        </svg>
        <span>Logout</span>
      </a>
    </li>
  `;

  navContainer.innerHTML = navMarkup + logoutItem;
}

renderAdminNav();

// LOGOUT HANDLER
const logoutBtn = document.getElementById("logoutBtn");

if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminUser");
    window.location.replace("./login.html");
  });
}
