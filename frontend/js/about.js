/* =========================================
   about.js
   Handles: sticky nav, mobile menu, smooth
   scroll, and scroll-reveal — same patterns
   as homepage script.js
========================================= */

(function () {
  "use strict";

  const navbar = document.getElementById("navbar");
  const hamburger = document.getElementById("hamburger");
  const navLinks = document.getElementById("navLinks");

  /* ------------------------------------------
     Sticky nav: .scrolled on scroll
  ------------------------------------------ */
  const handleScroll = () => {
    navbar.classList.toggle("scrolled", window.scrollY > 20);
  };
  window.addEventListener("scroll", handleScroll, { passive: true });
  handleScroll();

  /* ------------------------------------------
     Smooth scroll for on-page anchor links
  ------------------------------------------ */
  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", (e) => {
      const targetId = link.getAttribute("href");
      if (targetId === "#") return;
      const target = document.querySelector(targetId);
      if (!target) return;
      e.preventDefault();
      const top =
        target.getBoundingClientRect().top + window.pageYOffset - navbar.offsetHeight;
      window.scrollTo({ top, behavior: "smooth" });
    });
  });

  /* ------------------------------------------
     Scroll Reveal — Intersection Observer
     Targets .reveal (same system as homepage)
  ------------------------------------------ */
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -40px 0px" },
  );

  document.querySelectorAll(".reveal").forEach((el) => revealObserver.observe(el));
})();
