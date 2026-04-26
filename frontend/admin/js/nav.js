(function () {
  const user = JSON.parse(localStorage.getItem("adminUser"));

  if (!user) return;

  // Hide super admin items properly (hide the whole nav item)
  if (user.role !== "super_admin") {
    document.querySelectorAll(".super-admin-only").forEach((el) => {
      const navItem = el.closest(".admin-nav-item");
      if (navItem) {
        navItem.style.display = "none";
      }
    });
  }

  // Active link handling (keep as-is but make it safer)
  const links = document.querySelectorAll(".admin-nav-link");
  const currentPage = window.location.pathname.split("/").pop();

  links.forEach((link) => {
    const href = link.getAttribute("href");
    if (!href) return;

    if (href === currentPage) {
      link.parentElement.classList.add("active");
      link.setAttribute("aria-current", "page");
    }
  });
})();
