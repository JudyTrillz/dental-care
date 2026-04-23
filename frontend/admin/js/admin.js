/* =========================================
   admin.js
   Handles:
   A. Nav (hamburger)
   B. Fetch bookings from GET /api/bookings
   C. Render rows + stat cards
   D. Filter (date, dentist, status, search)
   E. Sortable columns
   F. Pagination
========================================= */

import { apiFetch, validateSession } from "./apiClient.js";
import "../js/connectionManager.js";
import { API_BASE } from "./config.js";

(async function () {
  "use strict";

  const isValid = await validateSession();
  if (!isValid) return;

  const currentUser = JSON.parse(localStorage.getItem("adminUser"));

  if (!currentUser) {
    window.location.href = "./login.html";
  }

  /* ---- DOM refs ---- */
  const hamburger = document.getElementById("adminHamburger");
  const navLinks = document.getElementById("adminNavLinks");
  const bookingsBody = document.getElementById("bookings-body");
  const tableLoading = document.getElementById("tableLoading");
  const tableEmpty = document.getElementById("tableEmpty");
  const bookingsTable = document.getElementById("bookingsTable");
  const dashCount = document.getElementById("dashboard-count");
  const filterDate = document.getElementById("filter-date");
  const filterDentist = document.getElementById("filter-dentist");
  const filterStatus = document.getElementById("filter-status");
  const searchInput = document.getElementById("search-patient");
  const pagePrev = document.getElementById("page-prev");
  const pageNext = document.getElementById("page-next");
  const pageNumbers = document.getElementById("pageNumbers");

  // Stat card values
  const statTotal = document.getElementById("stat-total");
  const statPending = document.getElementById("stat-pending");
  const statConfirmed = document.getElementById("stat-confirmed");
  const statCancelled = document.getElementById("stat-cancelled");

  /* ---- State ---- */
  let allBookings = []; // raw API data
  let filtered = []; // after filters applied
  let currentPage = 1;
  const PAGE_SIZE = 10;
  let sortCol = "date";
  let sortDir = "desc"; // 'asc' | 'desc'

  /* =========================================
     A. SIDEBAR TOGGLE (hamburger)
     Uses #menu-toggle + #sidebar per spec.
     Overlay closes sidebar on outside tap.
  ========================================= */
  const toggleBtn = document.getElementById("menu-toggle");
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("adminNavOverlay");
  const topBarTitle = document.querySelector(".topbar-title");

  function openSidebar() {
    sidebar.classList.add("active");
    toggleBtn.classList.add("active");
    toggleBtn.setAttribute("aria-expanded", "true");
    if (overlay) overlay.classList.add("active");
    document.body.style.overflow = "hidden";
    topBarTitle.style.display = "none";
  }

  function closeSidebar() {
    sidebar.classList.remove("active");
    toggleBtn.classList.remove("active");
    toggleBtn.setAttribute("aria-expanded", "false");
    if (overlay) overlay.classList.remove("active");
    document.body.style.overflow = "";
    topBarTitle.style.display = "";
  }

  if (toggleBtn && sidebar) {
    toggleBtn.addEventListener("click", () => {
      sidebar.classList.contains("active") ? closeSidebar() : openSidebar();
    });
  }

  if (overlay) {
    overlay.addEventListener("click", closeSidebar);
  }

  // Close when a nav link is tapped on mobile
  document.querySelectorAll(".admin-nav-link").forEach((link) => {
    link.addEventListener("click", () => {
      if (window.innerWidth <= 767) closeSidebar();
    });
  });

  // Close drawer if viewport widens past breakpoint (e.g. device rotation)
  window.addEventListener("resize", () => {
    if (window.innerWidth > 767) closeSidebar();
  });

  /* =========================================
     B. FETCH BOOKINGS
     Calls GET /api/bookings.
     Falls back to mock data in development
     if the API isn't available yet.
  ========================================= */
  async function fetchBookings() {
    showLoading(true);

    try {
      const res = await apiFetch(`${API_BASE}/api/bookings`, {
        headers: {
          Authorization: `Bearer ${window.__adminToken}`,
        },
      });

      if (res.status === 401) {
        // Token invalid or expired
        localStorage.removeItem("adminToken");
        window.location.replace("./login.html");
        return;
      }

      if (!res.success) {
        throw new Error(res.message || "Failed to load bookings");
      }

      const data = res.data;

      if (!Array.isArray(data)) {
        throw new Error("Invalid bookings data from server");
      }

      // Normalize keys to match your table & filters
      allBookings = data.map((b) => ({
        id: b.id || b.bookingId || "",
        patientName: b.patientName || b.fullName || "",
        fullName: b.fullName || b.patientName || "",
        phone: b.phone || "",
        email: b.email || "",
        dentist: b.dentistName || "",
        service: b.serviceName || "",
        date: b.date || "",
        startTime: b.startTime || b.time || "",
        endTime: b.endTime || "",
        status: (b.status || "pending").toLowerCase(),
      }));
    } catch (err) {
      console.error("[Admin] Bookings fetch failed:", err);

      // ❌ NO MOCK FALLBACK IN PRODUCTION
      allBookings = [];

      showCancelToast?.(err.message || "Failed to load bookings");
    }

    populateDentistFilter();
    applyFilters();
    updateStats();
    showLoading(false);
  }

  /* =========================================
     C. RENDER
  ========================================= */
  function render() {
    bookingsBody.innerHTML = "";

    if (filtered.length === 0) {
      bookingsTable.style.display = "none";
      tableEmpty.hidden = false;
      dashCount.textContent = "0 bookings found";
      renderPagination(0);
      return;
    }

    bookingsTable.style.display = "";
    tableEmpty.hidden = true;

    const start = (currentPage - 1) * PAGE_SIZE;
    const slice = filtered.slice(start, start + PAGE_SIZE);

    dashCount.textContent = `Showing ${start + 1}–${Math.min(start + PAGE_SIZE, filtered.length)} of ${filtered.length} booking${filtered.length !== 1 ? "s" : ""}`;

    slice.forEach((b, i) => {
      const tr = document.createElement("tr");

      tr.innerHTML = `
        <td class="col-id">${escHtml(b.id || "—")}</td>
        <td class="td-name">${escHtml(b.patientName || b.fullName || "—")}</td>
        <td>${escHtml(b.phone || "—")}</td>
        <td>${escHtml(b.email || "—")}</td>
        <td>${escHtml(b.dentist || "—")}</td>
        <td>${escHtml(b.service || "—")}</td>
        <td>${escHtml(formatDate(b.date))}</td>
        <td>${escHtml(b.startTime || b.time || "—")}</td>
        <td>${escHtml(b.endTime || "—")}</td>
        <td>${statusBadge(b.status)}</td>
        <td class="col-actions">
          ${b.status !== "confirmed" ? `<button class="action-btn action-btn--confirm" data-id="${b.id}" data-action="confirm">Confirm</button>` : ""}

          ${b.status !== "cancelled" ? `<button class="action-btn action-btn--cancel" data-id="${b.id}" data-action="cancel">Cancel</button>` : ""}
        </td>
      `;

      bookingsBody.appendChild(tr);
    });

    // *Attach action button listeners
    bookingsBody.querySelectorAll(".action-btn").forEach((btn) => {
      btn.addEventListener("click", handleAction);
    });

    renderPagination(filtered.length);
  }

  /* Status badge HTML */
  function statusBadge(status) {
    const s = (status || "pending").toLowerCase();
    return `<span class="status-badge status-badge--${s}">${escHtml(s)}</span>`;
  }

  /* =========================================
     D. FILTERS
  ========================================= */
  function applyFilters() {
    const date = filterDate.value;
    const dentist = filterDentist.value.toLowerCase();
    const status = filterStatus.value.toLowerCase();
    const search = searchInput.value.toLowerCase().trim();

    filtered = allBookings.filter((b) => {
      if (date && b.date !== date) return false;
      if (dentist && (b.dentist || "").toLowerCase() !== dentist) return false;
      if (status && (b.status || "").toLowerCase() !== status) return false;
      if (search) {
        const name = (b.patientName || b.fullName || "").toLowerCase();
        const email = (b.email || "").toLowerCase();
        if (!name.includes(search) && !email.includes(search)) return false;
      }
      return true;
    });

    sortFiltered();
    currentPage = 1;
    render();
  }

  /* Wire up filter controls */
  [filterDate, filterDentist, filterStatus].forEach((el) => {
    el.addEventListener("change", applyFilters);
  });

  searchInput.addEventListener("input", debounce(applyFilters, 250));

  /* Clear filters */
  document.getElementById("filter-reset").addEventListener("click", resetFilters);
  document.getElementById("filter-reset-empty").addEventListener("click", resetFilters);

  function resetFilters() {
    // Clear input fields
    filterDate.value = "";
    filterDentist.value = "";
    filterStatus.value = "";
    searchInput.value = "";

    // Re-apply filters to show all bookings
    applyFilters();

    // Re-populate dentist dropdown in case new dentists were added
    populateDentistFilter();
  }

  // Wire up the reset buttons
  document.getElementById("filter-reset").addEventListener("click", resetFilters);
  document.getElementById("filter-reset-empty").addEventListener("click", resetFilters);

  /* Populate dentist dropdown from API data */
  function populateDentistFilter() {
    if (!allBookings.length) {
      filterDentist.innerHTML = '<option value="">All Dentists</option>';
      return;
    }

    // get unique dentist names
    const dentists = Array.from(
      new Set(allBookings.map((b) => b.dentist).filter(Boolean)),
    ).sort();

    filterDentist.innerHTML =
      '<option value="">All Dentists</option>' +
      dentists
        .map((d) => `<option value="${escAttr(d)}">${escHtml(d)}</option>`)
        .join("");
  }

  /* =========================================
     E. SORT
  ========================================= */
  document.querySelectorAll(".sort-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const col = btn.dataset.col;
      if (sortCol === col) {
        sortDir = sortDir === "asc" ? "desc" : "asc";
      } else {
        sortCol = col;
        sortDir = "asc";
      }
      updateSortUI();
      sortFiltered();
      currentPage = 1;
      render();
    });
  });

  function sortFiltered() {
    filtered.sort((a, b) => {
      const va = (a[sortCol] || "").toString().toLowerCase();
      const vb = (b[sortCol] || "").toString().toLowerCase();
      return sortDir === "asc"
        ? va.localeCompare(vb, undefined, { numeric: true })
        : vb.localeCompare(va, undefined, { numeric: true });
    });
  }

  function updateSortUI() {
    document.querySelectorAll(".sort-btn").forEach((btn) => {
      btn.classList.remove("asc", "desc");
      if (btn.dataset.col === sortCol) btn.classList.add(sortDir);
    });
  }

  /* =========================================
     F. PAGINATION
  ========================================= */
  pagePrev.addEventListener("click", () => {
    if (currentPage > 1) {
      currentPage--;
      render();
    }
  });

  pageNext.addEventListener("click", () => {
    const total = Math.ceil(filtered.length / PAGE_SIZE);
    if (currentPage < total) {
      currentPage++;
      render();
    }
  });

  function renderPagination(total) {
    const pages = Math.ceil(total / PAGE_SIZE);
    pagePrev.disabled = currentPage === 1;
    pageNext.disabled = currentPage >= pages;

    pageNumbers.innerHTML = "";
    for (let i = 1; i <= pages; i++) {
      const btn = document.createElement("button");
      btn.className = "page-number" + (i === currentPage ? " active" : "");
      btn.textContent = i;
      btn.setAttribute("aria-label", `Page ${i}`);
      btn.addEventListener("click", () => {
        currentPage = i;
        render();
      });
      pageNumbers.appendChild(btn);
    }
  }

  /* =========================================
     G. STAT CARDS
  ========================================= */
  function updateStats() {
    const counts = { total: allBookings.length, pending: 0, confirmed: 0, cancelled: 0 };
    allBookings.forEach((b) => {
      const s = (b.status || "").toLowerCase();
      if (counts[s] !== undefined) counts[s]++;
    });
    statTotal.textContent = counts.total;
    statPending.textContent = counts.pending;
    statConfirmed.textContent = counts.confirmed;
    statCancelled.textContent = counts.cancelled;
  }

  /* =========================================
     H. ROW ACTIONS (confirm / cancel)
     Sends PATCH /api/bookings/:id
  ========================================= */

  async function handleAction(e) {
    const btn = e.currentTarget;
    const id = btn.dataset.id;
    const action = btn.dataset.action;

    const newStatus = action === "confirm" ? "confirmed" : "cancelled";

    btn.disabled = true;
    const originalText = btn.textContent;
    btn.textContent = action === "confirm" ? "Confirming..." : "Cancelling...";

    try {
      const res = await apiFetch(`${API_BASE}/api/bookings/${id}`, {
        method: "PATCH",
        body: { status: newStatus }, // ✅ FIXED HERE
      });

      if (res.status === 401) {
        localStorage.removeItem("adminToken");
        window.location.replace("./login.html");
        return;
      }

      if (!res.success) {
        throw new Error(res.message || "Failed to update booking");
      }

      // update local state
      const booking = allBookings.find((b) => String(b.id) === String(id));
      if (!booking) throw new Error("Booking not found");

      booking.status = newStatus;

      updateStats();
      applyFilters();

      if (newStatus === "confirmed") {
        showSuccessToast("Booking confirmed successfully");
      } else {
        showCancelToast("Booking cancelled successfully");
      }
    } catch (err) {
      console.error("[Admin] Action failed:", err);
      showCancelToast(err.message || "Action failed");
    } finally {
      btn.disabled = false;
      btn.textContent = originalText;
    }
  }
  /* =========================================
     UTILITIES
  ========================================= */
  function showLoading(show) {
    tableLoading.hidden = !show;
    if (show) {
      bookingsTable.style.display = "none";
      tableEmpty.hidden = true;
    }
  }

  function formatDate(dateStr) {
    if (!dateStr) return "—";
    try {
      return new Date(dateStr).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  }

  function escHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function escAttr(str) {
    return String(str).replace(/"/g, "&quot;");
  }

  function debounce(fn, delay) {
    let t;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...args), delay);
    };
  }

  const logoutBtn = document.getElementById("logout-btn");

  if (logoutBtn) {
    logoutBtn.addEventListener("click", (e) => {
      e.preventDefault();

      localStorage.removeItem("adminToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("adminUser");

      window.__adminToken = null;

      document.body.classList.remove("no-scroll");
      document.body.style.overflow = "";

      window.location.replace("./login.html");
    });
  }

  function showSuccessToast(message = "Action successful") {
    const toast = document.getElementById("successToast");
    const text = toast.querySelector("span");

    text.textContent = message;

    toast.hidden = false;

    // force reflow
    toast.offsetHeight;

    toast.classList.add("show");

    setTimeout(() => {
      toast.classList.remove("show");
      setTimeout(() => (toast.hidden = true), 400);
    }, 3000);
  }

  function showCancelToast(message = "Action completed") {
    const toast = document.getElementById("deleteToast");
    const text = toast.querySelector("span");

    text.textContent = message;

    toast.hidden = false;
    toast.offsetHeight;

    toast.classList.add("show");

    setTimeout(() => {
      toast.classList.remove("show");
      setTimeout(() => (toast.hidden = true), 400);
    }, 3000);
  }

  /* ---- Boot ---- */
  fetchBookings();
})();
