/* =========================================
   services.js
   Handles: sticky nav, mobile menu, scroll reveal,
   category filter, and active nav link
========================================= */

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
    { threshold: 0.1, rootMargin: "0px 0px -40px 0px" },
  );

  revealElements.forEach((el) => revealObserver.observe(el));

  /* =========================================
     Category filter
     Show/hide cards based on selected pill
  ========================================== */
  filterPills.forEach((pill) => {
    pill.addEventListener("click", () => {
      const filter = pill.dataset.filter;

      // Update active pill
      filterPills.forEach((p) => p.classList.remove("active"));
      pill.classList.add("active");

      // Show/hide cards
      allCards.forEach((card) => {
        const cat = card.dataset.category;
        if (filter === "all" || cat === filter) {
          card.classList.remove("hidden");
          card.style.display = "block";
          // Re-observe if not yet revealed
          if (!card.classList.contains("visible")) {
            revealObserver.observe(card);
          }
        } else {
          card.classList.add("hidden");
          card.style.display = "none";
        }
      });
    });
  });

  /* =========================================
     Active nav link based on current page
  ========================================== */
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
})();
