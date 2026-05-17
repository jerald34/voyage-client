/**
 * Agent thread and run API endpoints.
 */
import { fetchApi } from "./client.js";

export async function createAgentThread(agencyId, tripId = null) {
  const body = {};
  if (tripId) body.tripId = tripId;
  return fetchApi(`/agencies/${agencyId}/agent/threads`, {
    method: "POST",
    body: JSON.stringify(body),
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
    method: "DELETE",
  });
}

export async function sendMessage(agencyId, threadId, content) {
  return fetchApi(`/agencies/${agencyId}/agent/threads/${threadId}/messages`, {
    method: "POST",
    body: JSON.stringify({ content }),
  });
}

export async function approveAgentThreadItinerary(
  agencyId,
  threadId,
  payload,
) {
  return fetchApi(
    `/agencies/${agencyId}/agent/threads/${threadId}/approve-itinerary`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );
}

export async function fetchThreadMessages(
  agencyId,
  threadId,
  { cursor, limit } = {},
) {
  const params = new URLSearchParams();
  if (cursor) params.set("cursor", cursor);
  if (limit) params.set("limit", String(limit));
  const qs = params.toString();
  return fetchApi(
    `/agencies/${agencyId}/agent/threads/${threadId}/messages${qs ? `?${qs}` : ""}`,
  );
}

export async function cancelAgentRun(agencyId, runId) {
  return fetchApi(`/agencies/${agencyId}/agent/runs/${runId}/cancel`, {
    method: "POST",
  });
}
