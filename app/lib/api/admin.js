/**
 * Admin API endpoints.
 */
import { fetchApi } from "./client.js";

export async function fetchPendingAgencies() {
  return fetchApi("/admin/agencies/pending");
}

export async function fetchAllAgencies(status) {
  const params = status
    ? `?status=${encodeURIComponent(status)}`
    : "";
  return fetchApi(`/admin/agencies${params}`);
}

export async function fetchPendingCount() {
  return fetchApi("/admin/agencies/pending-count");
}

export async function fetchAgencyDetail(agencyId) {
  return fetchApi(`/admin/agencies/${agencyId}`);
}

export async function adminApproveAgency(agencyId) {
  return fetchApi(`/admin/agencies/${agencyId}/approve`, {
    method: "POST",
  });
}

export async function adminRejectAgency(agencyId, reason) {
  return fetchApi(`/admin/agencies/${agencyId}/reject`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  });
}

export async function adminSuspendAgency(agencyId, reason) {
  return fetchApi(`/admin/agencies/${agencyId}/suspend`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  });
}

export async function adminUnsuspendAgency(agencyId) {
  return fetchApi(`/admin/agencies/${agencyId}/unsuspend`, {
    method: "POST",
  });
}
