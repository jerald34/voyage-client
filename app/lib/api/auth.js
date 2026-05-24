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

export async function setAccountType(accountType) {
  return fetchApi("/auth/me/account-type", {
    method: "POST",
    body: JSON.stringify({ accountType }),
  });
}
