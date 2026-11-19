import axios from "axios";

const apiClient = axios.create({
  baseURL: "/api",
  timeout: 30000,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

// Let the browser generate the multipart boundary automatically when sending FormData.
apiClient.interceptors.request.use((config) => {
  if (config.data instanceof FormData) {
    delete config.headers["Content-Type"];
  }
  return config;
});

/**
 * Convert Axios / FastAPI error responses into a clean, readable message.
 */
export function extractErrorMessage(error, fallbackMessage = "An unexpected error occurred.") {
  if (!error) {
    return fallbackMessage;
  }

  if (error.code === "ECONNABORTED") {
    return "The request timed out. Please verify the backend service and try again.";
  }

  if (!error.response) {
    return "Cannot reach the backend server. Make sure the FastAPI server is running on port 8000.";
  }

  const { status, data } = error.response;

  // FastAPI HTTPException returns { detail: "..." }
  if (typeof data?.detail === "string" && data.detail.trim()) {
    return data.detail;
  }

  // FastAPI / Pydantic validation errors return { detail: [{ loc, msg, type }] }
  if (Array.isArray(data?.detail) && data.detail.length > 0) {
    const firstIssue = data.detail[0];
    if (typeof firstIssue?.msg === "string") {
      return firstIssue.msg;
    }
  }

  if (typeof data?.message === "string" && data.message.trim()) {
    return data.message;
  }

  // Vite proxy returns 500/502/504 with empty or plain text body when backend is offline.
  if (status >= 500 && (!data || typeof data === "string")) {
    return "Backend server is unavailable or returned an internal error.";
  }

  return fallbackMessage;
}

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    error.userMessage = extractErrorMessage(error);
    return Promise.reject(error);
  }
);

/**
 * Check backend health via GET /health (proxied through /api/health).
 */
export async function checkBackendHealth() {
  const response = await apiClient.get("/health", { timeout: 4000 });
  return response.data;
}

export default apiClient;

