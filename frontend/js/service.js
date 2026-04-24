/* =========================================
   services.js
   Handles: sticky nav, mobile menu, scroll reveal,
   category filter, and active nav link
========================================= */
import { apiFetch } from "../admin/js/apiClient.js";
import { API_BASE } from "./config.js";

(function () {
  "use strict";

  /* =========================================
     Elements
  ========================================== */
  const navbar = document.getElementById("navbar");
  const hamburger = document.getElementById("hamburger");
  const navLinks = document.getElementById("navLinks");
  const filterPills = document.querySelectorAll(".filter-pill");
  const allCards = document.querySelectorAll(".svc-card");
  const revealElements = document.querySelectorAll(".reveal");

  /* =========================================
     Sticky nav: add .scrolled on scroll
  ========================================== */
  const handleScroll = () => {
    navbar.classList.toggle("scrolled", window.scrollY > 20);
  };
  window.addEventListener("scroll", handleScroll, { passive: true });
  handleScroll(); // Run once on load

  /* =========================================
     Scroll Reveal — Intersection Observer
     Adds .visible when element enters viewport
  ========================================== */

  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          revealObserver.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.1,
      rootMargin: "0px 0px -40px 0px",
    },
  );

  function observeReveals() {
    document.querySelectorAll(".reveal:not(.visible)").forEach((el) => {
      revealObserver.observe(el);
    });
  }

  /* =========================================
     Category filter
     Show/hide cards based on selected pill
  ========================================== */
  filterPills.forEach((pill) => {
    pill.addEventListener("click", () => {
      if (!servicesData.length) return;

      const filter = pill.dataset.filter;

      filterPills.forEach((p) => p.classList.remove("active"));
      pill.classList.add("active");

      let filtered;

      if (filter === "all") {
        filtered = servicesData;
      } else {
        filtered = servicesData.filter((s) => s.category.toLowerCase() === filter);
      }

      renderServices(filtered);
    });
  });

  /* =========================================
   Active nav link based on current page
========================================= */
  //   document.addEventListener("DOMContentLoaded", () => {
  //     const navLinks = document.querySelectorAll(".nav-link");
  //     const currentPath = window.location.pathname.replace(/\/$/, ""); // remove trailing slash

  //     navLinks.forEach((link) => {
  //       link.classList.remove("active");
  //       const linkPath = new URL(link.href).pathname.replace(/\/$/, ""); // remove trailing slash

  //       // Match only filename (last segment)
  //       const currentPage = currentPath.split("/").pop();
  //       const linkPage = linkPath.split("/").pop();

  //       if (linkPage === currentPage) {
  //         link.classList.add("active");
  //       }
  //     });
  //   });

  function showErrorToast(message) {
    const toast = document.getElementById("errorToast");
    const text = document.getElementById("errorToastText");

    if (!toast || !text) return;

    text.textContent = message;
    toast.classList.add("show");

    clearTimeout(toast._timeout);

    toast._timeout = setTimeout(() => {
      toast.classList.remove("show");
    }, 4000);
  }

  function hideErrorToast() {
    const toast = document.getElementById("errorToast");
    if (!toast) return;

    toast.classList.remove("show");
  }

  let serverDown = false;

  async function fetchServices() {
    if (!grid) return;

    try {
      const res = await apiFetch("/api/public/services");

      if (!res.success) {
        throw new Error(res.message || "Failed to fetch services");
      }

      const dentists = Array.isArray(res.data) ? res.data : [];

      // ✅ clear grid before render
      grid.innerHTML = "";

      servicesData = services;

      renderServices(servicesData);

      serverDown = false;
    } catch (err) {
      console.error("Services fetch failed:", err);

      // ❗ only update UI once (avoid flicker)
      if (!serverDown) {
        serverDown = true;

        grid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 40px;">
          <p style="color:#ff4d4f; font-size:16px; font-weight:bold;">
            Services unavailable. Please try again.
          </p>
        </div>
      `;
      }
    }
  }

  setInterval(() => {
    if (serverDown) {
      fetchServices();
    }
  }, 5000);

  const grid = document.getElementById("servicesGrid");

  function getIcon(category) {
    switch (category) {
      case "Cosmetic":
        return "✨";
      case "Preventive":
        return "🪥";
      case "Restorative":
        return "🦷";
      case "Surgical":
        return "🔪";
      default:
        return "🦷";
    }
  }

  function renderServices(list) {
    if (!grid) return;

    grid.innerHTML = "";

    list.forEach((s, index) => {
      const article = document.createElement("article");
      article.className = "svc-card reveal";
      article.style.setProperty("--delay", `${index * 0.05}s`);
      article.dataset.category = s.category.toLowerCase();

      article.innerHTML = `
      <div class="svc-img-wrap">
        <img src="${API_BASE}/uploads/${s.image}" alt="${s.name}" loading="lazy" />
        <span class="svc-category-tag">${s.category}</span>
      </div>

      <div class="svc-body">
        <h3 class="svc-name">${s.name}</h3>

        <p class="svc-for">
          <span class="svc-for-label">For</span>
          ${s.forWho}
        </p>

        <p class="svc-what">
          ${s.what}
        </p>

        <p class="svc-outcome">
          <span class="svc-outcome-label">Outcome</span>
          ${s.outcome}
        </p>

        <a href="../index.html#bookingForm?service=${s.id}" class="svc-cta">
          Book this treatment
        </a>
      </div>
    `;

      grid.appendChild(article);
    });

    observeReveals();
  }

  let servicesData = [];

  fetchServices();
})();
