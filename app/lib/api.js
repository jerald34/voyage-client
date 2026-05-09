const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

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
      const error = new Error(data.error?.message || "An unexpected error occurred");
      error.code = data.error?.code || "UNKNOWN_ERROR";
      error.status = response.status;
      throw error;
    }

    return data;
  } catch (err) {
    if (err.status) throw err;
    
    // Network errors or other fetch failures
    const error = new Error("Unable to connect. Please try again.");
    error.code = "NETWORK_ERROR";
    error.status = 0;
    throw error;
  }
}

export async function createAgentThread(agencyId, tripId = null) {
  const body = {};
  if (tripId) body.tripId = tripId;
  return fetchApi(`/agencies/${agencyId}/agent/threads`, {
    method: 'POST',
    body: JSON.stringify(body)
  });
}

export async function listAgentThreads(agencyId) {
  return fetchApi(`/agencies/${agencyId}/agent/threads`);
}

export async function fetchAgentThread(agencyId, threadId) {
  return fetchApi(`/agencies/${agencyId}/agent/threads/${threadId}`);
}

export async function deleteAgentThread(agencyId, threadId) {
  return fetchApi(`/agencies/${agencyId}/agent/threads/${threadId}`, {
    method: 'DELETE'
  });
}

export async function sendMessage(agencyId, threadId, content) {
  return fetchApi(`/agencies/${agencyId}/agent/threads/${threadId}/messages`, {
    method: 'POST',
    body: JSON.stringify({ content })
  });
}

export async function approveAgentThreadItinerary(agencyId, threadId, payload) {
  return fetchApi(`/agencies/${agencyId}/agent/threads/${threadId}/approve-itinerary`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function listAgencyTrips(agencyId) {
  return fetchApi(`/agencies/${agencyId}/itineraries`);
}

export async function fetchItineraryDraft(agencyId, itineraryId) {
  return fetchApi(`/agencies/${agencyId}/itineraries/${itineraryId}`);
}

// Admin API

export async function fetchPendingAgencies() {
  return fetchApi("/admin/agencies/pending");
}

export async function fetchAllAgencies(status) {
  const params = status ? `?status=${encodeURIComponent(status)}` : "";
  return fetchApi(`/admin/agencies${params}`);
}

export async function fetchPendingCount() {
  return fetchApi("/admin/agencies/pending-count");
}

export async function fetchAgencyDetail(agencyId) {
  return fetchApi(`/admin/agencies/${agencyId}`);
}

export async function adminApproveAgency(agencyId) {
  return fetchApi(`/admin/agencies/${agencyId}/approve`, { method: "POST" });
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
  return fetchApi(`/admin/agencies/${agencyId}/unsuspend`, { method: "POST" });
}
