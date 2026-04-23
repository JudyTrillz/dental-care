/* =========================================
   DentalClinic — script.js
   Handles:
     - Sticky nav
     - Mobile menu
     - Smooth scroll
     - Scroll reveal
     - Testimonials slider
     - Booking form with hash preselect
========================================= */

import { apiFetch } from "../admin/js/apiClient.js";

import { showErrorToast, showSuccessToast } from "../admin/js/toast.js";

let wasOffline = !navigator.onLine;

window.addEventListener("offline", () => {
  wasOffline = true;
  showErrorToast("No internet connection. Please check your internet and try again");
});

window.addEventListener("online", () => {
  if (wasOffline) {
    showSuccessToast("Internet connection restored. Reloading...");
    setTimeout(() => location.reload(), 1000);
  }
  wasOffline = false;
});

(function () {
  "use strict";

  const serviceUI = {
    Cosmetic: {
      icon: "✨",
    },

    Preventive: {
      icon: "🪥",
    },

    Restorative: {
      icon: "🦷",
    },

    Surgical: {
      icon: "🔧",
    },

    Orthodontic: {
      icon: "🪛",
    },

    Implant: {
      icon: "🦴",
    },

    Emergency: {
      icon: "🚨",
    },

    Pediatric: {
      icon: "🧸",
    },
  };

  /* =========================================
     1. Navbar & Sticky Scroll
  ========================================== */
  const navbar = document.getElementById("navbar");
  const handleScroll = () => {
    if (window.scrollY > 20) {
      navbar.classList.add("scrolled");
    } else {
      navbar.classList.remove("scrolled");
    }
  };
  window.addEventListener("scroll", handleScroll, { passive: true });
  handleScroll();

  /* =========================================
     2. Mobile Hamburger Menu
  ========================================== */
  const hamburger = document.getElementById("hamburger");
  const navLinks = document.getElementById("navLinks");

  hamburger.addEventListener("click", () => {
    const isOpen = navLinks.classList.toggle("open");
    hamburger.classList.toggle("active", isOpen);
    hamburger.setAttribute("aria-expanded", isOpen ? "true" : "false");
    document.body.style.overflow = isOpen ? "hidden" : "";
  });

  navLinks.querySelectorAll(".nav-link").forEach((link) => {
    link.addEventListener("click", () => {
      hamburger.classList.remove("active");
      hamburger.setAttribute("aria-expanded", "false");
      navLinks.classList.remove("open");
      document.body.style.overflow = "";
    });
  });

  /* =========================================
     3. Smooth Scroll with Offset
  ========================================== */
  const allLinks = document.querySelectorAll('a[href^="#"]');
  allLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      const targetId = link.getAttribute("href");
      if (targetId === "#") return;
      const target = document.querySelector(targetId);
      if (!target) return;

      e.preventDefault();
      const navHeight = navbar.offsetHeight;
      const top = target.getBoundingClientRect().top + window.pageYOffset - navHeight;
      window.scrollTo({ top, behavior: "smooth" });
    });
  });

  /* =========================================
     5. Testimonials Slider
  ========================================== */
  (function initSlider() {
    const track = document.getElementById("testimonialTrack");
    if (!track) return;

    const dotsWrap = document.getElementById("testimonialDots");
    const prevBtn = document.getElementById("prevBtn");
    const nextBtn = document.getElementById("nextBtn");
    const cards = Array.from(track.children);
    const gap = 24; // gap in px
    let currentStep = 0;
    let cardsVisible = 3;

    const getCardsVisible = () => {
      if (window.innerWidth <= 600) return 1;
      if (window.innerWidth <= 900) return 2;
      return 3;
    };

    const totalSteps = () => cards.length - cardsVisible;

    const updateTrack = () => {
      cardsVisible = getCardsVisible();
      const sliderW = track.parentElement.offsetWidth;
      const cardW = (sliderW - gap * (cardsVisible - 1)) / cardsVisible;
      cards.forEach((c) => (c.style.flex = `0 0 ${cardW}px`));
      currentStep = Math.min(currentStep, totalSteps());
      track.style.transform = `translateX(-${currentStep * (cardW + gap)}px)`;
      updateDots();
      updateArrows();
    };

    const buildDots = () => {
      dotsWrap.innerHTML = "";
      for (let i = 0; i <= totalSteps(); i++) {
        const dot = document.createElement("button");
        dot.className = "testimonial-dot" + (i === 0 ? " active" : "");
        dot.setAttribute("role", "tab");
        dot.setAttribute("aria-label", `Go to slide ${i + 1}`);
        dot.addEventListener("click", () => {
          currentStep = i;
          updateTrack();
        });
        dotsWrap.appendChild(dot);
      }
    };

    const updateDots = () =>
      Array.from(dotsWrap.children).forEach((d, i) =>
        d.classList.toggle("active", i === currentStep),
      );
    const updateArrows = () => {
      prevBtn.disabled = currentStep === 0;
      nextBtn.disabled = currentStep >= totalSteps();
    };

    prevBtn.addEventListener("click", () => {
      if (currentStep > 0) currentStep-- && updateTrack();
    });
    nextBtn.addEventListener("click", () => {
      if (currentStep < totalSteps()) currentStep++ && updateTrack();
    });

    buildDots();
    updateTrack();

    window.addEventListener("resize", () =>
      setTimeout(() => {
        buildDots();
        updateTrack();
      }, 120),
    );
  })();

  /* =========================================
     6. Booking Form — Handles:
        - Hash preselection & scroll
        - Time slot selection
        - Dentist fetch
        - Validation & submit
  ========================================== */
  (function initBookingForm() {
    const form = document.getElementById("bookingForm");
    if (!form) return;

    const serviceSelect = document.getElementById("serviceSelect");
    const hiddenTime = document.getElementById("selectedTime");
    const display = document.getElementById("selectedTimeDisplay");
    const notification = form.querySelector("#bookingNotification");
    const submitBtn = form.querySelector(".booking-submit");

    const timeSlots = form.querySelectorAll(".time-slot");
    const dentistSelect = document.getElementById("dentistSelect");

    /* -----------------------------
       Helper: Show Notification
    ----------------------------- */
    const showNotification = (msg, type = "error") => {
      notification.textContent = msg;
      notification.className = `booking-notification show ${type}`;
      setTimeout(() => {
        notification.classList.remove("show");
        notification.textContent = "";
      }, 6000);
    };

    /* -----------------------------
       On page load — handle hash
    ----------------------------- */
    window.addEventListener("DOMContentLoaded", () => {
      const hash = window.location.hash;

      if (hash.includes("service=")) {
        const params = new URLSearchParams(hash.split("?")[1]);
        const serviceId = params.get("service");

        if (serviceId) {
          goToBooking(serviceId);
        }
      }

      /* -----------------------------
      On service button click (Using Delegation)
      ----------------------------- */
      document.addEventListener("click", (e) => {
        // Check if the clicked element (or its parent) is a service button
        const btn = e.target.closest(".service-button");

        if (btn) {
          e.preventDefault();
          const href = btn.getAttribute("href");

          if (href.includes("service=")) {
            const serviceId = href.split("service=")[1];
            goToBooking(serviceId);
            window.history.pushState({}, "", href);
          }
        }
      });
    });

    /* -----------------------------
       !! Helper: Scroll & Preselect Service
    ----------------------------- */
    const goToBooking = (serviceId) => {
      // 1. Disable browser scroll-memory for this session
      if ("scrollRestoration" in history) {
        history.scrollRestoration = "manual";
      }

      // 2. Preselect the service
      if (serviceSelect) {
        const trySetValue = () => {
          const optionExists = Array.from(serviceSelect.options).some(
            (opt) => opt.value === serviceId,
          );

          if (optionExists) {
            serviceSelect.value = serviceId;
          } else {
            setTimeout(trySetValue, 100); // retry until options are loaded
          }
        };

        trySetValue();
      }

      // 3. Scroll to the form
      form.scrollIntoView({ behavior: "smooth" });

      // 4. Clean the URL completely after a tiny delay
      // (This ensures the scroll completes before the URL resets)
      setTimeout(() => {
        history.replaceState(null, null, " ");
      }, 500);
    };

    /* -----------------------------
       Time slot selection
    ----------------------------- */
    timeSlots.forEach((slot) => {
      slot.addEventListener("click", () => {
        if (slot.classList.contains("active")) {
          slot.classList.remove("active");
          slot.setAttribute("aria-pressed", "false");
          hiddenTime.value = "";
          display.textContent = "";
          return;
        }
        timeSlots.forEach((s) => s.classList.remove("active"));
        timeSlots.forEach((s) => s.setAttribute("aria-pressed", "false"));
        slot.classList.add("active");
        slot.setAttribute("aria-pressed", "true");
        hiddenTime.value = slot.dataset.time;
        display.classList.remove("error");
        display.textContent = `Selected: ${slot.dataset.time}`;
      });
    });

    function updateTimeSlotsAvailability() {
      const dateInput = document.getElementById("appointmentDate");
      const slotsContainer = form.querySelector(".time-slots");

      if (!dateInput || !dateInput.value) return;

      const selectedDate = new Date(dateInput.value);
      const now = new Date();

      let availableSlots = 0;

      timeSlots.forEach((slot) => {
        const slotTime = formatTo24Hour(slot.dataset.time);
        if (!slotTime) return;

        const [hours, minutes] = slotTime.split(":").map(Number);

        // Build full datetime for slot
        const slotDateTime = new Date(selectedDate);
        slotDateTime.setHours(hours, minutes, 0, 0);

        // Reset
        slot.classList.remove("disabled");

        // Only apply logic for today
        if (selectedDate.toDateString() === now.toDateString()) {
          // Disable if time has passed (accurate to the minute)
          if (slotDateTime <= now) {
            slot.classList.add("disabled");

            if (slot.classList.contains("active")) {
              slot.classList.remove("active");
              hiddenTime.value = "";
              display.textContent = "";
            }
          } else {
            availableSlots++;
          }
        } else {
          // Future dates → everything available
          availableSlots++;
        }
      });

      /* =========================================
     Show message if no slots left
  ========================================== */
      if (availableSlots === 0) {
        display.textContent =
          "No available booking time today. Please check for a future date.";

        display.classList.add("error"); // 👈 add this
        hiddenTime.value = "";

        timeSlots.forEach((s) => {
          s.classList.remove("active");
          s.setAttribute("aria-pressed", "false");
        });
      } else {
        display.classList.remove("error"); // 👈 reset

        if (!hiddenTime.value) {
          display.textContent = "";
        }
      }
    }

    document
      .getElementById("appointmentDate")
      .addEventListener("change", updateTimeSlotsAvailability);

    /* -----------------------------
       Fetch Dentists
    ----------------------------- */
    let dentistServerDown = false;

    async function loadDentists() {
      try {
        const res = await fetch("http://localhost:5000/api/public/dentists");

        if (!res.ok) throw new Error("Failed to fetch dentists");

        const data = await res.json();
        const dentists = Array.isArray(data.data) ? data.data : [];

        dentistSelect.innerHTML = `<option value="" disabled selected>Choose your dentist</option>`;

        dentists.forEach((d) => {
          const option = document.createElement("option");
          option.value = d.id;
          option.textContent = d.name;
          dentistSelect.appendChild(option);
        });

        dentistServerDown = false;
      } catch (err) {
        console.error("Dentists fetch failed:", err);

        if (!dentistServerDown) {
          dentistServerDown = true;
          showNotification("Unable to load dentists. Retrying...");
        }

        setTimeout(loadDentists, 5000);
      }
    }

    loadDentists();

    /* -----------------------------
       Fetch Services
    ----------------------------- */
    let serviceServerDown = false;

    async function loadServicesForForm() {
      try {
        const res = await fetch("http://localhost:5000/api/public/services");

        if (!res.ok) throw new Error("Failed to fetch services");

        const data = await res.json();
        const services = Array.isArray(data.data) ? data.data : [];

        serviceSelect.innerHTML = `<option value="" disabled selected>Choose the treatment you need</option>`;

        services.forEach((s) => {
          const option = document.createElement("option");
          option.value = s.id;
          option.textContent = `${s.name} — ${s.duration || ""} mins`;
          serviceSelect.appendChild(option);
        });

        serviceServerDown = false;
      } catch (err) {
        console.error("Services fetch failed:", err);

        if (!serviceServerDown) {
          serviceServerDown = true;
          showNotification("Unable to load services. Retrying...");
        }

        setTimeout(loadServicesForForm, 5000);
      }
    }

    loadServicesForForm();
    /* -----------------------------
       Time format helper
    ----------------------------- */
    const formatTo24Hour = (time) => {
      if (!time) return null;

      const parts = time.split(" ");
      if (parts.length !== 2) return null;

      let [timePart, modifier] = parts;

      let hours, minutes;

      if (timePart.includes(":")) {
        [hours, minutes] = timePart.split(":").map(Number);
      } else {
        hours = Number(timePart);
        minutes = 0;
      }

      if (modifier === "PM" && hours !== 12) hours += 12;
      if (modifier === "AM" && hours === 12) hours = 0;

      return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
    };

    /* -----------------------------
       Form submit
    ----------------------------- */
    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      if (
        !form.service.value ||
        !form.dentist.value ||
        !form.date.value ||
        !form.fullName.value ||
        !form.phone.value ||
        !form.email.value
      ) {
        showNotification("Please fill all required fields.");
        return;
      }
      if (!hiddenTime.value) {
        const slotsGroup = form.querySelector(".time-slots");
        slotsGroup.style.outline = "2px solid #ff4d4f";
        slotsGroup.style.borderRadius = "8px";
        setTimeout(() => (slotsGroup.style.outline = ""), 2000);
        showNotification("Select a time slot.");
        return;
      }

      const payload = {
        serviceId: form.service.value,
        dentistId: form.dentist.value,
        date: form.date.value,
        startTime: formatTo24Hour(hiddenTime.value),
        fullName: form.fullName.value.trim(),
        phone: form.phone.value.trim(),
        email: form.email.value.trim(),
      };

      try {
        submitBtn.disabled = true;
        submitBtn.textContent = "Processing...";

        const response = await fetch("http://localhost:5000/api/bookings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await response.json();

        if (!response.ok) throw new Error(data.error || "Booking failed");

        showNotification("Booking confirmed!", "success");
        submitBtn.textContent = "✓ Confirmed";

        form.reset();
        hiddenTime.value = "";
        display.textContent = "";
        timeSlots.forEach((s) => s.classList.remove("active"));

        setTimeout(() => {
          submitBtn.disabled = false;
          submitBtn.textContent = "Confirm Booking";
        }, 3000);
      } catch (err) {
        console.error(err);
        showNotification(err.message);
        submitBtn.disabled = false;
        submitBtn.textContent = "Confirm Booking";
      }
    });

    /* -----------------------------
       Set min date for appointment
    ----------------------------- */
    const appointmentDate = document.getElementById("appointmentDate");
    if (appointmentDate) {
      const today = new Date().toISOString().split("T")[0];
      appointmentDate.setAttribute("min", today);
    }
  })(); // end booking form

  /* =========================================
   Dynamic active nav link based on URL
   Works on all pages
========================================= */

  (function setActiveNavLink() {
    const navLinks = document.querySelectorAll(".nav-link");

    // Get current pathname and remove leading slash
    const path = window.location.pathname.replace(/^\/+/, ""); // "about.html" or "services.html" or ""
    const page = path || "index.html"; // default to index.html for home

    navLinks.forEach((link) => {
      const href = link.getAttribute("href");

      // Skip tel: or external links
      if (!href || href.startsWith("tel:") || href.startsWith("http")) return;

      // Normalize href
      const linkHref = href.replace(/^\/+/, ""); // remove leading slash

      if (page === "index.html") {
        // Home page: highlight only #hero
        if (linkHref === "#hero") {
          link.classList.add("nav-link--active");
        }
      } else {
        // Subpages: highlight link matching current HTML
        if (linkHref === page) {
          link.classList.add("nav-link--active");
        }
      }
    });
  })();

  let serverDown = false;

  function renderHomepageServices() {
    const container = document.querySelector(".services-grid");

    if (!container) return;

    async function loadHomepageServices() {
      const container = document.querySelector(".services-grid");
      if (!container) return;

      try {
        const res = await apiFetch("http://localhost:5000/api/public/services");

        if (!res.success) {
          throw new Error(res.message || "Failed to load services");
        }

        const services = res.data;

        container.innerHTML = "";

        services.slice(0, 4).forEach((s, index) => {
          const meta = serviceUI[s.category] || {};
          const icon = meta.icon || "🦷";

          const card = document.createElement("article");
          card.className = "service-card reveal";
          card.style.setProperty("--delay", `${index * 0.1}s`);

          card.innerHTML = `
        <div class="service-card-top">
          <span class="service-icon">${icon}</span>
          <span class="service-duration">${s.duration || ""} mins</span>
        </div>

        <h3 class="service-name">${s.name}</h3>

        <p class="service-description">
          ${s.forWho ? s.forWho : "No description available"}
        </p>

        <a href="#book?service=${s.id}" class="service-button">
          Book this service
        </a>
      `;

          container.appendChild(card);
          revealObserver.observe(card);
        });
      } catch (err) {
        console.error("Failed to load services", err);

        container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 40px;">
        <p style="color:#ff4d4f; font-size:16px; font-weight:bold;">
          Unable to load services. Please check your connection.
        </p>
      </div>
    `;

        // 🔴 IMPORTANT: retry after delay
        setTimeout(loadHomepageServices, 5000);
      }
    }

    // initial load
    loadHomepageServices();
  }

  renderHomepageServices();

  /* =========================================
     4. Scroll Reveal — Intersection Observer
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
      threshold: 0.15,
      rootMargin: "0px 0px 0px 0px",
    },
  );

  document.querySelectorAll(".reveal").forEach((el) => revealObserver.observe(el));
})();
