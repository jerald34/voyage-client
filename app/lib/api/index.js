/**
 * Unified API module — re-exports everything from domain-specific files.
 *
 * Consumers can import from "../../lib/api" and get the same exports
 * as the original monolithic api.js.
 */

// Base client
export { fetchApi, API_URL } from "./client.js";

// Auth
export { updateCurrentUserProfile, setAccountType } from "./auth.js";

// Agency
export {
  updateAgencySettings,
  listAgencyTrips,
  deleteAgencyTrip,
  fetchItineraryDraft,
  bootstrapAgentWorkspace,
} from "./agency.js";

// Agent threads & runs
export {
  createAgentThread,
  listAgentThreads,
  fetchAgentThread,
  deleteAgentThread,
  sendMessage,
  uploadChatImages,
  approveAgentThreadItinerary,
  fetchThreadMessages,
  cancelAgentRun,
} from "./agent.js";

// Shares & comments
export {
  createItineraryShare,
  listTripShares,
  revokeShare,
  listShareComments,
  replyToShareComment,
  getUnreadCommentCount,
  getUnreadCommentCountsByTrip,
  fetchPublicItinerary,
  postPublicComment,
  listPublicComments,
} from "./shares.js";

// Admin
export {
  fetchPendingAgencies,
  fetchAllAgencies,
  fetchPendingCount,
  fetchAgencyDetail,
  adminApproveAgency,
  adminRejectAgency,
  adminSuspendAgency,
  adminUnsuspendAgency,
} from "./admin.js";

// Team & agency management
export {
  fetchTeam,
  inviteMember,
  changeMemberRole,
  removeMember,
  transferOwnership,
  deleteAgency,
} from "./team.js";

// Personal account (/me/*)
export * from "./personal.js";
