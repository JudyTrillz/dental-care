const LOCAL_API = "http://localhost:5000";
const PROD_API = "https://dental-care--ojudy007.replit.app";

/**
 * Detect environment safely
 */
function getApiBase() {
  const hostname = window.location.hostname;

  // Local development
  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return LOCAL_API;
  }

  // Everything else = production
  return PROD_API;
}

export const API_BASE = getApiBase();
