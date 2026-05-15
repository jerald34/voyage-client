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

export async function updateCurrentUserProfile(payload) {
  return fetchApi("/auth/me", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function updateAgencySettings(agencyId, payload) {
  return fetchApi(`/agencies/${agencyId}/settings`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
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

export async function deleteAgencyTrip(agencyId, tripId) {
  return fetchApi(`/agencies/${agencyId}/itineraries/trips/${tripId}`, {
    method: 'DELETE'
  });
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

// Share API

export async function createItineraryShare(agencyId, itineraryId, payload = {}) {
  return fetchApi(`/agencies/${agencyId}/shares/${itineraryId}`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function listTripShares(agencyId, tripId) {
  const params = tripId ? `?tripId=${encodeURIComponent(tripId)}` : "";
  return fetchApi(`/agencies/${agencyId}/shares${params}`);
}

export async function revokeShare(agencyId, shareId) {
  return fetchApi(`/agencies/${agencyId}/shares/${shareId}`, {
    method: "DELETE",
  });
}

export async function listShareComments(agencyId, shareId) {
  return fetchApi(`/agencies/${agencyId}/shares/${shareId}/comments`);
}

export async function replyToShareComment(agencyId, commentId, content) {
  return fetchApi(`/agencies/${agencyId}/shares/comments/${commentId}/reply`, {
    method: "POST",
    body: JSON.stringify({ content }),
  });
}

export async function getUnreadCommentCount(agencyId) {
  return fetchApi(`/agencies/${agencyId}/shares/unread-count`);
}

export async function fetchPublicItinerary(token) {
  const url = `${API_URL}/shared/${token}`;
  const response = await fetch(url, {
    headers: { "Content-Type": "application/json" },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.error?.message || "Itinerary not available");
    error.code = data.error?.code || "UNKNOWN_ERROR";
    error.status = response.status;
    throw error;
  }
  return data;
}

export async function cancelAgentRun(agencyId, runId) {
  return fetchApi(`/agencies/${agencyId}/agent/runs/${runId}/cancel`, { method: "POST" });
}

export async function postPublicComment(token, payload) {
  const url = `${API_URL}/shared/${token}/comments`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.error?.message || "Failed to post comment");
    error.code = data.error?.code || "UNKNOWN_ERROR";
    error.status = response.status;
    throw error;
  }
  return data;
}
