(function () {
  const user = JSON.parse(localStorage.getItem("adminUser"));

  if (!user) return;

  if (user.role !== "super_admin") {
    document.querySelectorAll(".super-admin-only").forEach((el) => {
      el.style.display = "none";
    });
  }

  // Optional: highlight active link safely
  const links = document.querySelectorAll(".admin-nav-link");
  const currentPage = window.location.pathname.split("/").pop();

  links.forEach((link) => {
    if (link.getAttribute("href") === currentPage) {
      link.parentElement.classList.add("active");
      link.setAttribute("aria-current", "page");
    }
  });
})();
