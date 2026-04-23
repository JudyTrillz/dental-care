/* =========================================
   services-admin.js
   A. Sidebar toggle (same pattern as admin.js)
   B. Fetch + render services  GET /api/services
   C. Add service              POST /api/services
   D. Delete service           DELETE /api/services/:id
   E. Image preview
========================================= */

import { apiFetch, validateSession } from "./apiClient.js";
import "../js/connectionManager.js";
import { API_BASE } from "./config.js";

(async function () {
  "use strict";

  const isValid = await validateSession();
  if (!isValid) return;

  const user = JSON.parse(localStorage.getItem("adminUser") || "{}");

  if (user.role !== "super_admin") {
    window.location.href = "index.html";
    return;
  }

  const currentUser = JSON.parse(localStorage.getItem("adminUser"));

  if (!currentUser) {
    window.location.href = "./login.html";
  }

  /* =========================================
     A. SIDEBAR TOGGLE
  ========================================= */
  const toggleBtn = document.getElementById("menu-toggle");
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("adminNavOverlay");
  const modalBackdrop = document.getElementById("deleteModal");
  const modalConfirm = document.getElementById("confirmDelete");
  const modalCancel = document.getElementById("cancelDelete");
  const modalError = document.getElementById("deleteModalError");
  const modalName = document.getElementById("deleteModalName");
  const topBarTitle = document.querySelector(".topbar-title");

  // Modal to confirm delete service
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
    if (toggleBtn) toggleBtn.classList.remove("active");
    if (toggleBtn) toggleBtn.setAttribute("aria-expanded", "false");
    if (overlay) overlay.classList.remove("active");
    document.body.style.overflow = "";
    topBarTitle.style.display = "";
  }

  if (toggleBtn && sidebar) {
    toggleBtn.addEventListener("click", () => {
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
     B. DOM REFS
  ========================================= */
  const svcGrid = document.getElementById("svcGrid");
  const svcLoading = document.getElementById("svcLoading");
  const svcEmpty = document.getElementById("svcEmpty");
  const svcCount = document.getElementById("svc-count");

  // Form elements
  const toggleFormBtn = document.getElementById("toggleFormBtn");
  const closeFormBtn = document.getElementById("closeFormBtn");
  const addServicePanel = document.getElementById("addServicePanel");
  const addServiceForm = document.getElementById("addServiceForm");
  const formError = document.getElementById("formError");
  const submitBtn = document.getElementById("addServiceSubmit");
  const submitLabel = document.querySelector(".svc-submit-label");
  const submitLoading = document.querySelector(".svc-submit-loading"); // change the above button to document .querySelector

  // Image preview
  const fileInput = document.getElementById("svcImage");
  const uploadUi = document.getElementById("svcUploadUi");
  const uploadPreview = document.getElementById("svcUploadPreview");

  /* =========================================
     FORM PANEL TOGGLE
  ========================================= */
  toggleFormBtn.addEventListener("click", () => {
    const isHidden = addServicePanel.hidden;
    addServicePanel.hidden = !isHidden;
    toggleFormBtn.setAttribute("aria-expanded", String(isHidden));
    if (isHidden) {
      hideFormFeedback();
      addServicePanel.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  });

  function closeFormPanel() {
    addServicePanel.hidden = true;
    toggleFormBtn.setAttribute("aria-expanded", "false");
    resetForm();
  }

  closeFormBtn.addEventListener("click", () => {
    closeFormPanel();
  });

  /* =========================================
     IMAGE PREVIEW
  ========================================= */
  fileInput.addEventListener("change", () => {
    const file = fileInput.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    uploadPreview.src = url;
    uploadPreview.hidden = false;
    uploadUi.hidden = true;
  });

  /* =========================================
     C. FETCH + RENDER SERVICES
  ========================================= */
  let services = []; // in-memory store

  async function fetchServices() {
    showLoading(true);

    try {
      const res = await apiFetch(`${API_BASE}/api/services`);

      if (!res.success) {
        throw new Error(res.message || "Failed to load services");
        showDeleteToast(message);
      }

      services = res.data || [];
    } catch (err) {
      console.error("[Services] Fetch failed:", err);

      services = [];

      showDeleteToast?.(err.message || "Failed to load services");
    }

    renderServices();
    showLoading(false);
  }

  function renderServices() {
    svcGrid.innerHTML = "";

    if (services.length === 0) {
      svcEmpty.hidden = false;
      svcGrid.hidden = true;
      svcCount.textContent = "0 services";
      return;
    }

    svcEmpty.hidden = true;
    svcGrid.hidden = false;
    svcCount.textContent = `${services.length} service${services.length !== 1 ? "s" : ""}`;

    services.forEach((svc) => {
      const card = buildCard(svc);
      svcGrid.appendChild(card);
    });
  }

  //! Image Builder
  function getImageSrc(image) {
    if (!image) return "";

    // If already full URL, use as-is
    if (image.startsWith("http")) return image;

    // Otherwise build it
    return `${API_BASE}/uploads/${image}`;
  }

  /* Build a single service card DOM element */
  function buildCard(svc) {
    const article = document.createElement("article");
    article.className = "svc-card";
    article.dataset.id = svc.id;

    // CTA link — auto-generated from service ID
    const ctaHref = `../index.html#bookingForm?service=${encodeURIComponent(svc.id)}`;

    // Image or placeholder
    const imgSrc = getImageSrc(svc.image);
    const imgHtml = imgSrc
      ? `<img src="${imgSrc}" alt="${svc.name}" loading="lazy" />`
      : `<div class="svc-card-img-placeholder" aria-hidden="true">
       <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
         <rect x="3" y="3" width="18" height="18" rx="2"/>
         <circle cx="8.5" cy="8.5" r="1.5"/>
         <polyline points="21 15 16 10 5 21"/>
       </svg>
     </div>`;

    article.innerHTML = `
      ${imgHtml}
      <div class="svc-card-body">
        <h3 class="svc-card-name">${escHtml(svc.name)}</h3>

        <div class="svc-card-block">
          <span class="svc-card-block-label svc-card-block-label--for">For</span>
          <p class="svc-card-block-text">${escHtml(svc.forWho || svc.for || "")}</p>
        </div>

        <div class="svc-card-block">
          <span class="svc-card-block-label svc-card-block-label--what">What</span>
          <p class="svc-card-block-text">${escHtml(svc.description || svc.what || "")}</p>
        </div>

        <div class="svc-card-block">
          <span class="svc-card-block-label svc-card-block-label--outcome">Outcome</span>
          <p class="svc-card-block-text">${escHtml(svc.outcome || "")}</p>
        </div>
      </div>

      <div class="svc-card-footer">
        <button
          class="svc-delete-btn"
          data-id="${escHtml(svc.id)}"
          data-name="${escHtml(svc.name)}"
          type="button"
          aria-label="Delete ${escHtml(svc.name)}"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>
          Delete this service
        </button>
      </div>
    `;

    // Wire delete
    article.querySelector(".svc-delete-btn").addEventListener("click", handleDelete);

    return article;
  }

  /* =========================================
     D. ADD SERVICE
  ========================================= */
  addServiceForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const file = fileInput.files[0];
    const data = {
      name: addServiceForm.svcName.value.trim(),
      category: addServiceForm.svcCategory.value.trim(),
      duration: addServiceForm.svcDuration.value.trim(),
      forWho: addServiceForm.svcFor.value.trim(),
      what: addServiceForm.svcWhat.value.trim(),
      outcome: addServiceForm.svcOutcome.value.trim(),
    };

    // VALIDATION
    if (
      !data.name ||
      !data.category ||
      !data.duration ||
      !data.forWho ||
      !data.what ||
      !data.outcome
    ) {
      showFormError("All fields are required.");
      return;
    }

    if (isNaN(Number(data.duration))) {
      showFormError("Duration must be a number.");
      return;
    }

    if (!file) {
      showFormError("Service image is required.");
      return;
    }

    if (!["image/jpeg", "image/png", "image/webp", "image/avif"].includes(file.type)) {
      showFormError("Only JPG, PNG, WEBP allowed.");
      return;
    }

    setSubmitLoading(true);
    submitBtn.disabled = true;

    try {
      const formData = new FormData();

      Object.entries(data).forEach(([key, value]) => {
        formData.append(key, value);
      });

      formData.append("image", file);

      const res = await apiFetch(`${API_BASE}/api/services`, {
        method: "POST",
        body: formData, // or { name, price } depending on your form
      });

      if (!res.success) {
        throw new Error(res.message || "Failed to add service");
        showDeleteToast(message);
      }

      const result = res.data;

      if (!result) {
        throw new Error("Invalid server response");
      }

      // UPDATE UI
      showSuccessToast();
      services.unshift(result);
      renderServices();

      addServicePanel.hidden = true;
      resetForm();
    } catch (err) {
      console.error("[Add Service Error]:", err);
      showFormError(err.message || "Failed to add service.");
    } finally {
      setSubmitLoading(false);
      submitBtn.disabled = false;
    }
  });

  /* =========================================
     E. DELETE SERVICE
  ========================================= */
  let serviceToDelete = null;

  function openModal(name) {
    modalName.textContent = name;
    modalError.hidden = true;
    modalError.textContent = "";
    modalBackdrop.hidden = false;
  }

  function closeModal() {
    modalBackdrop.hidden = true;
    serviceToDelete = null;
  }

  function setModalLoading(loading) {
    modalConfirm.disabled = loading;
    modalCancel.disabled = loading;
    confirmLabel.hidden = loading;
    confirmLoading.hidden = !loading;
    confirmLoading.setAttribute("aria-hidden", String(!loading));
  }

  function handleDelete(e) {
    const btn = e.currentTarget;

    serviceToDelete = {
      id: btn.dataset.id,
      name: btn.dataset.name,
      btn: btn,
    };

    openModal(serviceToDelete.name);
  }

  // Confirm deletion
  modalConfirm.addEventListener("click", async () => {
    if (!serviceToDelete) return;

    const { id, btn } = serviceToDelete;

    btn.disabled = true;
    btn.textContent = "Deleting…";

    try {
      const res = await apiFetch(`${API_BASE}/api/services/${encodeURIComponent(id)}`, {
        method: "DELETE",
      });

      if (!res.success) {
        // Optional: allow silent ignore if already deleted
        if (res.status === 404) {
          console.warn("Service already deleted");
        } else {
          throw new Error(res.message || "Failed to delete service");
        }
      }

      // Remove from local store + re-render
      services = services.filter((s) => s.id !== id);
      renderServices();
      showDeleteToast();
    } catch (err) {
      console.error("[Services] Delete failed:", err);
      alert("Failed to delete service.");
      btn.disabled = false;
      btn.textContent = "Delete";
    }

    closeModal();
    serviceToDelete = null;
  });

  // Cancel deletion
  modalCancel.addEventListener("click", closeModal);

  /* =========================================
     HELPERS
  ========================================= */
  function showLoading(show) {
    svcLoading.hidden = !show;
    if (show) {
      svcEmpty.hidden = true;
      svcGrid.hidden = true;
    }
  }

  function setSubmitLoading(loading) {
    submitBtn.disabled = loading;
    submitLabel.hidden = loading;
    submitLoading.hidden = !loading;
    submitLoading.setAttribute("aria-hidden", String(!loading));
  }

  function showFormError(msg) {
    formError.textContent = msg;
    formError.hidden = false;

    // auto-hide error after 5s
    setTimeout(() => {
      formError.hidden = true;
    }, 5000);

    formError.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  const successToast = document.getElementById("successToast");
  const deleteToast = document.getElementById("deleteToast");

  // Activate success toast
  function showSuccessToast(message = "Service Added Successfully") {
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

  function hideFormFeedback() {
    formError.hidden = true;
  }

  function resetForm() {
    addServiceForm.reset();
    uploadPreview.hidden = true;
    uploadPreview.src = "";
    uploadUi.hidden = false;
  }
  function escHtml(str) {
    return String(str ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
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
  fetchServices();
})();
