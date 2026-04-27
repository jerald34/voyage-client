const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

/**
 * Thin fetch wrapper for the Voyage API.
 *
 * - Prepends the API base URL to the path.
 * - Sets `credentials: "include"` so the browser sends/receives HTTP-only
 *   session cookies cross-origin.
 * - Defaults Content-Type to application/json.
 * - On non-OK responses, throws an error with `code`, `message`, and `status`.
 * - On network failure, throws with `code: "NETWORK_ERROR"`.
 */
export async function fetchApi(path, options = {}) {
  let response;

  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });
  } catch (_networkError) {
    const error = new Error("Unable to connect. Please try again.");
    error.code = "NETWORK_ERROR";
    error.status = 0;
    throw error;
  }

  const data = await response.json();

  if (!response.ok) {
    const error = new Error(data.error?.message || "Request failed.");
    error.code = data.error?.code || "UNKNOWN_ERROR";
    error.status = response.status;
    throw error;
  }

  return data;
}
