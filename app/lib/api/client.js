/**
 * Base API client — fetch wrapper with auth credentials and error handling.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export { API_URL };

export async function fetchApi(path, options = {}) {
  const url = `${API_URL}${path}`;

  const defaultOptions = {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    ...options,
  };

  try {
    const response = await fetch(url, defaultOptions);
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const error = new Error(
        data.error?.message || "An unexpected error occurred",
      );
      error.code = data.error?.code || "UNKNOWN_ERROR";
      error.status = response.status;
      error.issues = data.error?.issues || [];
      throw error;
    }

    return data;
  } catch (err) {
    if (err.status) throw err;

    // Network errors or other fetch failures
    const error = new Error("Unable to connect. Please try again.");
    error.code = "NETWORK_ERROR";
    error.status = 0;
    error.issues = [];
    throw error;
  }
}
