import { showErrorToast, showSuccessToast } from "./toast.js";

let isOffline = !navigator.onLine;
let serverDown = false;
let checkingServer = false;

/* =========================
   SERVER CHECK
========================= */
async function checkServer() {
  if (checkingServer) return;
  checkingServer = true;

  try {
    const res = await fetch("http://localhost:5000/api/public/services", {
      method: "GET",
      cache: "no-store",
    });

    if (!res.ok) throw new Error("Server error");

    // ✅ SERVER RECOVERED
    if (serverDown) {
      serverDown = false;
      showSuccessToast("Server restored. Reloading...");
      setTimeout(() => location.reload(), 1000);
    }
  } catch (err) {
    // ❗ Only show once
    if (!serverDown && !isOffline) {
      serverDown = true;
      showErrorToast("Server unavailable. Trying to reconnect...");
    }
  }

  checkingServer = false;
}

/* =========================
   INTERNET HANDLERS
========================= */
function handleOffline() {
  isOffline = true;

  showErrorToast("No internet connection. Waiting to reconnect...");
}

function handleOnline() {
  if (!isOffline) return;

  isOffline = false;

  showSuccessToast("Internet restored. Reloading...");
  setTimeout(() => location.reload(), 1000);
}

/* =========================
   INIT
========================= */
export function initConnectionManager() {
  // 🔹 run immediately
  if (!navigator.onLine) {
    handleOffline();
  } else {
    checkServer();
  }

  // 🔹 listen to network changes
  window.addEventListener("offline", handleOffline);
  window.addEventListener("online", handleOnline);

  // 🔹 keep checking server every 5s
  setInterval(() => {
    if (!isOffline) {
      checkServer();
    }
  }, 5000);
}
