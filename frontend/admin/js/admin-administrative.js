/* =========================================
   admins.js  — Admin Management UI
   UI-only as specified. API stubs are present
   (marked TODO) so backend wiring requires
   changing only the fetch calls — all state,
   render, and interaction logic stays intact.

   Pattern: same IIFE + async/await used
   across admin.js / services-admin.js /
   admin-dentists.js
========================================= */
import { apiFetch, validateSession } from "./apiClient.js";
import "../js/connectionManager.js";

(async function () {
  "use strict";

  const isValid = await validateSession();
  if (!isValid) return;

  const user = JSON.parse(localStorage.getItem("adminUser") || {});

  if (user.role !== "super_admin") {
    window.location.href = "index.html";
    return;
  }

  /* =========================================
     CONFIG — change endpoints here only
  ========================================= */
  const API = {
    list: "http://localhost:5000/api/auth/admins",
    create: "http://localhost:5000/api/auth/create-admin",
    delete: (id) =>
      `http://localhost:5000/api/auth/delete-admin/${encodeURIComponent(id)}`,
  };

  /* =========================================
     STATE
  ========================================= */
  let admins = []; // in-memory list
  let pendingDeleteId = null; // admin targeted by delete modal

  /* =========================================
     DOM REFS
  ========================================= */

  // Layout
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("adminNavOverlay");
  const menuToggle = document.getElementById("menu-toggle");

  // Page header
  const createAdminBtn = document.getElementById("createAdminBtn");

  // Create modal
  const createModal = document.getElementById("createAdminModal");
  const createModalClose = document.getElementById("createModalClose");
  const createAdminCancel = document.getElementById("createAdminCancel");
  const createAdminForm = document.getElementById("createAdminForm");
  const createAdminError = document.getElementById("createAdminError");
  const createAdminSubmit = document.getElementById("createAdminSubmit");
  const createLabel = createAdminSubmit.querySelector(".adm-create-label");
  const createLoading = createAdminSubmit.querySelector(".adm-create-loading");

  // Delete modal
  const deleteModal = document.getElementById("deleteAdminModal");
  const deleteAdminEmail = document.getElementById("deleteAdminEmail");
  const deleteAdminCancel = document.getElementById("deleteAdminCancel");
  const deleteAdminConfirm = document.getElementById("deleteAdminConfirm");
  const deleteAdminError = document.getElementById("deleteAdminError");
  const deleteConfirmLabel = deleteAdminConfirm.querySelector(".dnt-confirm-label");
  const deleteConfirmLoad = deleteAdminConfirm.querySelector(".dnt-confirm-loading");

  // List section
  const adminsLoading = document.getElementById("adminsLoading");
  const adminsError = document.getElementById("adminsError");
  const adminsEmpty = document.getElementById("adminsEmpty");
  const adminsTableWrap = document.getElementById("adminsTableWrap");
  const adminsTableBody = document.getElementById("adminsTableBody");

  /* =========================================
     SIDEBAR TOGGLE (same as all other pages)
  ========================================= */
  const topBarTitle = document.querySelector(".topbar-title");

  function openSidebar() {
    sidebar.classList.add("active");
    menuToggle.classList.add("active");
    menuToggle.setAttribute("aria-expanded", "true");
    if (overlay) overlay.classList.add("active");
    document.body.style.overflow = "hidden";
    topBarTitle.style.display = "none";
  }

  function closeSidebar() {
    sidebar.classList.remove("active");
    if (menuToggle) menuToggle.classList.remove("active");
    if (menuToggle) menuToggle.setAttribute("aria-expanded", "false");
    if (overlay) overlay.classList.remove("active");
    document.body.style.overflow = "";
    topBarTitle.style.display = "";
  }

  if (menuToggle && sidebar) {
    menuToggle.addEventListener("click", () =>
      sidebar.classList.contains("active") ? closeSidebar() : openSidebar(),
    );
  }

  if (overlay) overlay.addEventListener("click", closeSidebar);

  document.querySelectorAll(".admin-nav-link").forEach((link) => {
    link.addEventListener("click", () => {
      if (window.innerWidth <= 767) closeSidebar();
    });
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 767) closeSidebar();
  });

  /* =========================================
     LOAD ADMINS
  ========================================= */
  async function loadAdmins() {
    showListState("loading");

    try {
      const res = await apiFetch(API.list);

      if (!res.success) {
        throw new Error(res.message || "Failed to fetch admins");
      }

      admins = res.data;

      renderTable();
      showListState(admins.length === 0 ? "empty" : "table");
    } catch (err) {
      console.error("[Admins] Load failed:", err);
      showListState("error");
    }
  }

  /* =========================================
     RENDER TABLE
  ========================================= */
  function renderTable() {
    adminsTableBody.innerHTML = "";

    admins.forEach((admin) => {
      const tr = document.createElement("tr");
      tr.dataset.id = admin.id;

      const roleCls =
        admin.role === "super_admin"
          ? "adm-role-badge adm-role-badge--super-admin"
          : "adm-role-badge adm-role-badge--admin";

      const roleText = admin.role === "super_admin" ? "super_admin" : "admin";

      tr.innerHTML = `
        <td class="adm-email">${esc(admin.email)}</td>
        <td><span class="${roleCls}">${esc(roleText)}</span></td>
        <td class="adm-date">${esc(formatDate(admin.createdAt))}</td>
        <td class="col-actions">
          <button
            class="action-btn action-btn--cancel delete-admin"
            type="button"
            data-id="${esc(admin.id)}"
            data-email="${esc(admin.email)}"
            aria-label="Delete ${esc(admin.email)}"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true" style="width:13px;height:13px;vertical-align:middle;margin-right:3px;">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
              <path d="M10 11v6M14 11v6"/>
              <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
            </svg>
            Delete
          </button>
        </td>
      `;

      tr.querySelector(".delete-admin").addEventListener("click", onDeleteClick);
      adminsTableBody.appendChild(tr);
    });
  }

  /* =========================================
     LIST STATE HELPER
  ========================================= */
  function showListState(state) {
    adminsLoading.hidden = state !== "loading";
    adminsError.hidden = state !== "error";
    adminsEmpty.hidden = state !== "empty";
    adminsTableWrap.hidden = state !== "table";

    // aria-busy on the loading div
    adminsLoading.setAttribute("aria-busy", String(state === "loading"));
  }

  /* =========================================
     CREATE ADMIN MODAL
  ========================================= */
  function openCreateModal() {
    createAdminForm.reset();
    createAdminError.hidden = true;
    setCreateLoading(false);
    createModal.hidden = false;
    document.body.style.overflow = "hidden";
    document.getElementById("adminEmail").focus();
  }

  function closeCreateModal() {
    createModal.hidden = true;
    document.body.style.overflow = "";
  }

  createAdminBtn.addEventListener("click", openCreateModal);
  createModalClose.addEventListener("click", closeCreateModal);
  createAdminCancel.addEventListener("click", closeCreateModal);

  // Close on backdrop click
  createModal.addEventListener("click", (e) => {
    if (e.target === createModal) closeCreateModal();
  });

  // Create admin form submit
  createAdminForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    createAdminError.hidden = true;

    const email = createAdminForm.adminEmail.value.trim();
    const password = createAdminForm.adminPassword.value;
    const role = createAdminForm.adminRole.value;

    // Client-side validation
    const errors = [];
    if (!email) errors.push("Email is required.");
    if (!password) errors.push("Password is required.");
    if (!role) errors.push("Role is required.");

    if (errors.length) {
      showCreateError(errors.join(" "));
      return;
    }

    setCreateLoading(true);

    try {
      const res = await apiFetch(API.create, {
        method: "POST",
        body: { email, password, role },
      });

      if (!res.success) {
        throw new Error(res.message || "Failed to create admin");
      }

      // Re-fetch full list to stay consistent with DB
      await loadAdmins();

      closeCreateModal();
      const successToast = document.getElementById("successToast");

      if (successToast) {
        successToast.querySelector("span").textContent =
          `Admin ${email} created successfully`;
        successToast.classList.add("show");

        setTimeout(() => {
          successToast.classList.remove("show");
        }, 3000);
      }
    } catch (err) {
      console.error("[Admins] Create failed:", err);
      showCreateError(err.message || "Something went wrong. Please try again.");
    } finally {
      setCreateLoading(false);
    }
  });

  function showCreateError(msg) {
    createAdminError.textContent = msg;
    createAdminError.hidden = false;
  }

  function setCreateLoading(loading) {
    createAdminSubmit.disabled = loading;
    createLabel.hidden = loading;
    createLoading.hidden = !loading;
    createLoading.setAttribute("aria-hidden", String(!loading));
  }

  /* =========================================
     DELETE ADMIN MODAL
  ========================================= */
  function onDeleteClick(e) {
    const btn = e.currentTarget;
    pendingDeleteId = btn.dataset.id;
    deleteAdminEmail.textContent = btn.dataset.email;
    deleteAdminError.hidden = true;
    setDeleteLoading(false);
    deleteModal.hidden = false;
    document.body.style.overflow = "hidden";
    deleteAdminCancel.focus();
  }

  function closeDeleteModal() {
    deleteModal.hidden = true;
    pendingDeleteId = null;
    document.body.style.overflow = "";
  }

  deleteAdminCancel.addEventListener("click", closeDeleteModal);

  deleteModal.addEventListener("click", (e) => {
    if (e.target === deleteModal) closeDeleteModal();
  });

  deleteAdminConfirm.addEventListener("click", async () => {
    if (!pendingDeleteId) return;

    const id = pendingDeleteId;
    deleteAdminError.hidden = true;
    setDeleteLoading(true);

    try {
      const res = await apiFetch(API.delete(id), {
        method: "DELETE",
      });

      if (!res.success) {
        throw new Error(res.message || "Failed to delete admin");
      }

      // Get email before refresh for toast
      const deleted = admins.find((a) => String(a.id) === String(id));
      const email = deleted ? deleted.email : "Admin";

      // Refresh list from backend (source of truth)
      await loadAdmins();

      closeDeleteModal();

      // Use your custom toast
      const deleteToast = document.getElementById("deleteToast");
      if (deleteToast) {
        deleteToast.querySelector("span").textContent = `${email} deleted successfully`;
        deleteToast.classList.add("show");

        setTimeout(() => {
          deleteToast.classList.remove("show");
        }, 3000);
      }
    } catch (err) {
      console.error("[Admins] Delete failed:", err);
      deleteAdminError.textContent = err.message || "Delete failed. Please try again.";
      deleteAdminError.hidden = false;
    } finally {
      setDeleteLoading(false);
    }
  });

  function setDeleteLoading(loading) {
    deleteAdminConfirm.disabled = loading;
    deleteAdminCancel.disabled = loading;
    deleteConfirmLabel.hidden = loading;
    deleteConfirmLoad.hidden = !loading;
    deleteConfirmLoad.setAttribute("aria-hidden", String(!loading));
  }

  /* =========================================
     ESC KEY — closes whichever modal is open
  ========================================= */
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    if (!createModal.hidden) closeCreateModal();
    if (!deleteModal.hidden) closeDeleteModal();
  });

  /* =========================================
     UTILITIES
  ========================================= */
  function esc(str) {
    return String(str ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function formatDate(iso) {
    if (!iso) return "—";
    try {
      return new Date(iso).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return iso;
    }
  }

  function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /* =========================================
     log out from admins
  ========================================= */
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

  /* =========================================
     BOOT
  ========================================= */
  loadAdmins();
})();
