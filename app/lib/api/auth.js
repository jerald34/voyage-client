/**
 * Auth-related API endpoints.
 */
import { fetchApi } from "./client.js";

export async function updateCurrentUserProfile(payload) {
  return fetchApi("/auth/me", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}
