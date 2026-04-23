import { showErrorToast } from "./toast.js";
import { initConnectionManager } from "./connectionManager.js";

function getToken() {
  return localStorage.getItem("adminToken");
}

export async function apiFetch(url, options = {}) {
  const isFormData = options.body instanceof FormData;

  const res = await fetch(url, {
    method: options.method || "GET",
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(options.headers || {}),
      Authorization: getToken() ? `Bearer ${getToken()}` : "",
    },
    body: options.body && !isFormData ? JSON.stringify(options.body) : options.body,
  });

  let data;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  return {
    success: res.ok,
    status: res.status,
    data: data?.data ?? data,
    message: data?.message || data?.error || null,
  };
}

export async function validateSession() {
  try {
    const res = await apiFetch("http://localhost:5000/api/auth/me");

    if (res.status === 401 || res.status === 403) {
      throw new Error("Invalid session");
    }

    // ❗ server down or network error → DO NOT logout
    if (!res.success) {
      console.warn("Server issue, skipping logout");
      return false;
    }

    const user = res.data;

    if (!user) {
      throw new Error("No user returned");
    }

    localStorage.setItem("adminUser", JSON.stringify(user));

    return true;
  } catch (err) {
    console.error("Session check failed:", err);

    // ❗ Only logout if it's actually auth-related
    if (err.message === "Invalid session") {
      localStorage.removeItem("adminToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("adminUser");

      window.location.href = "login.html";
    }

    return false;
  }
}

initConnectionManager();
