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

(function () {
  "use strict";

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
    { threshold: 0.15, rootMargin: "0px 0px -40px 0px" },
  );

  document.querySelectorAll(".reveal").forEach((el) => revealObserver.observe(el));

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
       Helper: Scroll & Preselect Service
    ----------------------------- */
    const goToBooking = (serviceId) => {
      if (serviceSelect) serviceSelect.value = serviceId;
      form.scrollIntoView({ behavior: "smooth" });
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

          // ✅ Clean the URL after using it
          history.replaceState(null, null, window.location.pathname);
        }
      }
    });

    /* -----------------------------
       On service button click
    ----------------------------- */
    document.querySelectorAll(".service-button").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        const href = btn.getAttribute("href");
        if (href.includes("service=")) {
          const serviceId = href.split("service=")[1];
          goToBooking(serviceId);
          window.history.pushState({}, "", href); // update URL
        }
      });
    });

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
    fetch("https://dental-care--ojudy007.replit.app/api/dentists")
      .then((res) => res.json())
      .then((dentists) =>
        dentists.forEach((d) => {
          const option = document.createElement("option");
          option.value = d.id;
          option.textContent = d.name;
          dentistSelect.appendChild(option);
        }),
      )
      .catch(() => showNotification("Failed to load dentists"));

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

        const response = await fetch(
          "https://dental-care--ojudy007.replit.app/api/bookings",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          },
        );
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
        showNotification("Server error. Try again.");
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
})();
