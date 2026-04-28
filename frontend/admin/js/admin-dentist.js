/* =========================================
   admin-dentists.js
   Architecture:
     API   — all fetch calls, one place to change endpoints
     State — in-memory dentists array, mutated only through API
     DOM   — render/build functions, no API calls
     UI    — sidebar, modal, toast, form panel helpers
   Pattern: IIFE, async/await, no frameworks
========================================= */
import { apiFetch, validateSession } from "./apiClient.js";
import "../js/connectionManager.js";
import { API_BASE } from "./config.js";

(async function () {
  "use strict";

  const isValid = await validateSession();
  if (!isValid) return;

  const user = JSON.parse(localStorage.getItem("adminUser") || "{}");

  if (!user || !user.role) {
    window.location.href = "./login.html";
    return;
  }

  if (user.role !== "super_admin") {
    window.location.href = "index.html";
    return;
  }

  const currentUser = JSON.parse(localStorage.getItem("adminUser"));

  if (!currentUser) {
    window.location.href = "./login.html";
  }

  /* =========================================
     CONFIG — change endpoints here only
  ========================================= */
  const API = {
    list: "/api/dentists",
    create: "/api/dentists",
    delete: (id) => `/api/dentists/${encodeURIComponent(id)}`,
  };

  /* =========================================
     STATE
  ========================================= */
  let dentists = []; // single source of truth
  let pendingDeleteId = null; // tracks which dentist modal is targeting

  /* =========================================
     DOM REFS
  ========================================= */
  // Layout
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("adminNavOverlay");
  const menuToggle = document.getElementById("menu-toggle");

  // Page header
  const dntCount = document.getElementById("dnt-count");
  const toggleFormBtn = document.getElementById("toggleFormBtn");

  // Form panel
  const addDentistPanel = document.getElementById("addDentistPanel");
  const closeFormBtn = document.getElementById("closeFormBtn");
  const addDentistForm = document.getElementById("addDentistForm");
  const formError = document.getElementById("formError");
  const addDentistSubmit = document.getElementById("addDentistSubmit");
  const dntSubmitLabel = addDentistSubmit.querySelector(".dnt-submit-label");
  const dntSubmitLoading = addDentistSubmit.querySelector(".dnt-submit-loading");

  // Image upload
  const dntImageInput = document.getElementById("dntImage");
  const dntUploadUi = document.getElementById("dntUploadUi");
  const dntUploadPreview = document.getElementById("dntUploadPreview");

  // Grid + states
  const dntGrid = document.getElementById("dntGrid");
  const dntLoading = document.getElementById("dntLoading");
  const dntEmpty = document.getElementById("dntEmpty");

  // Modal
  const modalBackdrop = document.getElementById("deleteModalBackdrop");
  const modalName = document.getElementById("deleteModalName");
  const modalCancel = document.getElementById("deleteModalCancel");
  const modalConfirm = document.getElementById("deleteModalConfirm");
  const modalError = document.getElementById("deleteModalError");
  const confirmLabel = modalConfirm.querySelector(".dnt-confirm-label");
  const confirmLoading = modalConfirm.querySelector(".dnt-confirm-loading");
  const topBarTitle = document.querySelector(".topbar-title");

  /* =========================================
     API LAYER
     Separate from DOM. Each function returns
     data or throws a descriptive Error.
  ========================================= */
  const api = {
    async fetchAll() {
      const res = await apiFetch(API.list);

      if (!res.success) {
        throw new Error(res.message || "Failed to load dentists");
      }

      const data = res.data;

      if (!Array.isArray(data)) {
        throw new Error("Invalid server response");
      }

      return data.map((d) => ({
        id: d.id || d._id,
        name: d.name,
        role: d.role,
        bio: d.bio,
        image: d.image ? `${API_BASE}/uploads/${d.image}` : "",
      }));
    },

    async create(formData) {
      const res = await apiFetch(API.create, {
        method: "POST",
        body: formData,
      });

      if (!res.success) {
        throw new Error(res.message || "Failed to create dentist");
      }

      const created = res.data;

      if (!created) {
        throw new Error("Invalid server response");
      }

      return {
        id: created.id || created._id,
        name: created.name,
        role: created.role,
        bio: created.bio,
        image: created.image ? `${API_BASE}/uploads/${created.image}` : "",
      };
    },

    async remove(id) {
      const res = await apiFetch(API.delete(id), {
        method: "DELETE",
      });

      if (!res.success && res.status !== 404) {
        throw new Error(res.message || "Failed to delete dentist");
      }
    },
  };

  /* =========================================
     STATE MUTATIONS
     Always call renderGrid() after a mutation.
  ========================================= */
  function prependDentist(dentist) {
    dentists.unshift(dentist);
    renderGrid();
  }

  function removeDentist(id) {
    dentists = dentists.filter((d) => String(d.id) !== String(id));
    renderGrid();
  }

  /* =========================================
     DOM — GRID RENDER
  ========================================= */
  function renderGrid() {
    dntGrid.innerHTML = "";

    const count = dentists.length;
    dntCount.textContent = `${count} dentist${count !== 1 ? "s" : ""}`;

    if (count === 0) {
      dntEmpty.hidden = false;
      dntGrid.hidden = true;
      return;
    }

    dntEmpty.hidden = false; // keep hidden
    dntEmpty.hidden = true;
    dntGrid.hidden = false;

    dentists.forEach((d) => dntGrid.appendChild(buildCard(d)));
  }

  /* =========================================
     DOM — BUILD SINGLE CARD
     No API calls. Pure DOM construction.
  ========================================= */
  function buildCard(d) {
    const article = document.createElement("article");
    article.className = "dnt-card";
    article.dataset.id = d.id;

    const imgHtml = d.image
      ? `<img class="dnt-avatar" src="${esc(d.image)}" alt="${esc(d.name)}" loading="lazy" />`
      : `<div class="dnt-avatar-placeholder" aria-hidden="true">
           <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
             <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
             <circle cx="12" cy="7" r="4"/>
           </svg>
         </div>`;

    article.innerHTML = `
      <header class="dnt-card-header">
        ${imgHtml}
        <div class="dnt-card-identity">
          <p class="dnt-card-name">${esc(d.name)}</p>
          <p class="dnt-card-role">${esc(d.role)}</p>
        </div>
      </header>
      <div class="dnt-card-body">
        <p class="dnt-card-bio">${esc(d.bio)}</p>
      </div>
      <footer class="dnt-card-footer">
        <button
          class="svc-delete-btn"
          type="button"
          data-id="${esc(d.id)}"
          data-name="${esc(d.name)}"
          aria-label="Delete ${esc(d.name)}"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
            <path d="M10 11v6M14 11v6"/>
            <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
          </svg>
          Delete
        </button>
      </footer>
    `;

    // One listener per card, scoped to this element — no delegation needed
    article.querySelector(".svc-delete-btn").addEventListener("click", onDeleteClick);

    return article;
  }

  /* =========================================
     LOAD DENTISTS ON PAGE READY
  ========================================= */
  async function loadDentists() {
    setLoadingState(true);

    try {
      dentists = await api.fetchAll();
    } catch (err) {
      console.error("[Dentists] Load failed:", err.message);
    }

    renderGrid();
    setLoadingState(false);
  }

  function setLoadingState(loading) {
    dntLoading.hidden = !loading;
    if (loading) {
      dntEmpty.hidden = true;
      dntGrid.hidden = true;
    }
  }

  /* =========================================
     ADD DENTIST — FORM SUBMIT
  ========================================= */
  addDentistForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    formError.hidden = true;

    // — Client-side validation —
    const name = addDentistForm.dntName.value.trim();
    const role = addDentistForm.dntRole.value.trim();
    const bio = addDentistForm.dntBio.value.trim();
    const file = dntImageInput.files[0];

    const errors = [];
    if (!file) errors.push("A profile photo is required.");
    if (!name) errors.push("Doctor name is required.");
    if (!role) errors.push("Role / specialty is required.");
    if (!bio) errors.push("Bio is required.");

    if (errors.length) {
      showFormError(errors.join(" "));
      return;
    }

    setFormLoading(true);

    const formData = new FormData();
    formData.append("image", file);
    formData.append("name", name);
    formData.append("role", role);
    formData.append("bio", bio);

    try {
      const created = await api.create(formData);

      // Update state + UI — no page reload
      prependDentist(created);

      // Success feedback — form closes ONLY on success
      resetForm();
      closeFormPanel();
      showSuccessToast(`${created.name} has been added to the team successfully`);
    } catch (err) {
      console.error("[Dentists] Create failed:", err);
      showFormError(err.message || "Unable to add dentist. Try again.");
    } finally {
      setFormLoading(false);
    }
  });

  /* =========================================
     DELETE DENTIST — MODAL FLOW
  ========================================= */
  function onDeleteClick(e) {
    const btn = e.currentTarget;
    const id = btn.dataset.id;
    const name = btn.dataset.name;

    pendingDeleteId = id;
    openModal(name);
  }

  function openModal(name) {
    modalName.textContent = name;
    modalError.hidden = true;
    modalError.textContent = "";
    setModalLoading(false);
    modalBackdrop.hidden = false;
    modalCancel.focus();
  }

  function closeModal() {
    modalBackdrop.hidden = true;
    pendingDeleteId = null;
  }

  modalCancel.addEventListener("click", closeModal);

  // Close on backdrop click (but not on modal itself)
  modalBackdrop.addEventListener("click", (e) => {
    if (e.target === modalBackdrop) closeModal();
  });

  // Close on Escape
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !modalBackdrop.hidden) closeModal();
  });

  modalConfirm.addEventListener("click", async () => {
    if (!pendingDeleteId) return;

    const id = pendingDeleteId;
    modalError.hidden = true;
    setModalLoading(true);

    try {
      await api.remove(id);

      const deleted = dentists.find((d) => String(d.id) === String(id));
      const name = deleted ? deleted.name : "Dentist";

      removeDentist(id);
      closeModal();
      showDeleteToast(`${name} has been removed from the team successfully`);
    } catch (err) {
      console.error("[Dentists] Delete failed:", err);

      modalError.textContent = "Unable to delete dentist. Try again.";
      modalError.hidden = false;
    } finally {
      setModalLoading(false);
    }
  });

  function setModalLoading(loading) {
    modalConfirm.disabled = loading;
    modalCancel.disabled = loading;
    confirmLabel.hidden = loading;
    confirmLoading.hidden = !loading;
    confirmLoading.setAttribute("aria-hidden", String(!loading));
  }

  /* =========================================
     TOAST SYSTEM
  ========================================= */
  // Activate success toast
  function showSuccessToast(message = "Service Added Successfully") {
    const successToast = document.getElementById("successToast");
    if (!successToast) return;

    successToast.querySelector("span").textContent = message;
    successToast.hidden = false;

    requestAnimationFrame(() => {
      successToast.classList.add("show");
    });

    setTimeout(() => {
      successToast.classList.remove("show");
      setTimeout(() => {
        successToast.hidden = true;
      }, 400);
    }, 4000);
  }

  // Activate Delete toast
  function showDeleteToast(message = "Service Deleted Successfully") {
    const deleteToast = document.getElementById("deleteToast");

    if (!deleteToast) return;

    deleteToast.querySelector("span").textContent = message;
    deleteToast.hidden = false;

    requestAnimationFrame(() => {
      deleteToast.classList.add("show");
    });

    setTimeout(() => {
      deleteToast.classList.remove("show");
      setTimeout(() => {
        deleteToast.hidden = true;
      }, 400);
    }, 4000);
  }
  /* =========================================
     FORM PANEL HELPERS
  ========================================= */
  toggleFormBtn.addEventListener("click", () => {
    const isHidden = addDentistPanel.hidden;
    addDentistPanel.hidden = !isHidden;
    toggleFormBtn.setAttribute("aria-expanded", String(isHidden));
    if (isHidden) {
      addDentistPanel.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  });

  closeFormBtn.addEventListener("click", () => {
    closeFormPanel();
    resetForm();
  });

  function closeFormPanel() {
    addDentistPanel.hidden = true;
    toggleFormBtn.setAttribute("aria-expanded", "false");
  }

  function setFormLoading(loading) {
    addDentistSubmit.disabled = loading;
    dntSubmitLabel.hidden = loading;
    dntSubmitLoading.hidden = !loading;
    dntSubmitLoading.setAttribute("aria-hidden", String(!loading));
  }

  function showFormError(msg) {
    formError.textContent = msg;
    formError.hidden = false;
    formSuccess.hidden = true;
    formError.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function resetForm() {
    addDentistForm.reset();
    dntUploadPreview.hidden = true;
    dntUploadPreview.src = "";
    dntUploadUi.hidden = false;
  }

  /* =========================================
     IMAGE PREVIEW
  ========================================= */
  dntImageInput.addEventListener("change", () => {
    const file = dntImageInput.files[0];
    if (!file) return;
    dntUploadPreview.src = URL.createObjectURL(file);
    dntUploadPreview.hidden = false;
    dntUploadUi.hidden = true;
  });

  /* =========================================
     SIDEBAR (same as admin.js / services-admin.js)
  ========================================= */
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
    menuToggle.addEventListener("click", () => {
      sidebar.classList.contains("active") ? closeSidebar() : openSidebar();
    });
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
     UTILITIES
  ========================================= */
  function esc(str) {
    return String(str ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  // Detect network/server errors so dev fallback triggers for 4xx/5xx
  // but not for programmer errors like undefined references
  function isDev(err) {
    const msg = err.message || "";
    return (
      msg.includes("Failed to fetch") ||
      msg.includes("NetworkError") ||
      msg.includes("HTTP 4") ||
      msg.includes("HTTP 5") ||
      msg.includes("Server error") ||
      msg.includes("Delete failed")
    );
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

  /* =========================================
     BOOT
  ========================================= */
  loadDentists();
})();
