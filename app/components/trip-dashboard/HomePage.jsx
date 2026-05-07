import { useEffect, useMemo, useRef, useState } from "react";
import "./HomePage.css";
import { useAuth } from "../../hooks/useAuth.js";
import { useAgentRunStream } from "../../hooks/useAgentRunStream.js";
import { useTripPlanning } from "../../hooks/useTripPlanning.js";
import {
  approveAgentThreadItinerary,
  deleteAgentThread,
  fetchItineraryDraft,
} from "../../lib/api.js";
import {
  getAgencyPortfolioSummary,
  getAgentPriorityQueue,
  getApprovalBlockers,
  getUrgentDepartures,
} from "../../lib/agency-dashboard/selectors.js";
import { buildPlaceEntities } from "../../lib/trip-dashboard/placeEntities.js";

import AgentCommandCenter from "./command-center/AgentCommandCenter.jsx";
import ItineraryDraftPanel from "./itinerary/ItineraryDraftPanel.jsx";
import ClientItineraryPage from "./pages/ClientItineraryPage.jsx";
import ApproveItineraryModal from "./modals/ApproveItineraryModal.jsx";
import DashboardHeader from "./layout/DashboardHeader.jsx";
import DashboardSidebar from "./layout/DashboardSidebar.jsx";

// Minimal UI helpers
const getInitials = (name) => {
  const parts = String(name ?? "").trim().split(/\s+/).filter(Boolean);
  return parts.length === 0 ? "VP" : parts.slice(0, 2).map(p => p[0]?.toUpperCase() ?? "").join("");
};

const getRunStatusLabel = (runStatus, streamError) => {
  if (streamError) return "Needs attention";
  if (runStatus === "completed") return "Idle";
  if (runStatus === "in_progress" || runStatus === "running") return "Agent streaming";
  return "Ready";
};

export default function HomePage({ user: userProp, agencyTrips = [], onContinue, onOpenTrip, onNewItinerary }) {
  const { logout } = useAuth();
  const [user, setUser] = useState(userProp || null);
  const agencyId = user?.memberships?.[0]?.agencyId ?? null;

  const {
    activeContext,
    setActiveContext,
    tripStates,
    setTripStates,
    draftThreadStates,
    setDraftThreadStates,
    draftThreadOrder,
    setDraftThreadOrder,
    isSending,
    isCreatingDraftThread,
    agentError,
    setAgentError,
    runTargetRef,
    ensureTripThreadState,
    loadInitialThreads,
    dispatchMessage,
    createPlanningContext,
    createRunTargetKey,
  } = useTripPlanning(agencyId);

  const [composerInput, setComposerInput] = useState("");
  const [deletingThreadId, setDeletingThreadId] = useState(null);
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [isApprovingDraft, setIsApprovingDraft] = useState(false);
  const [approvalError, setApprovalError] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("command-center");
  const [selectedPlaceId, setSelectedPlaceId] = useState("");

  const {
    isStreaming,
    runStatus,
    assistantMessage,
    toolCalls,
    mapMarkers,
    routeEstimates,
    activeToolLabel,
    lastItineraryUpdate,
    lastCompletedItineraryTool,
    error: streamError,
    startStream,
  } = useAgentRunStream(agencyId ?? "");

  // Load user
  useEffect(() => { setUser(userProp); }, [userProp]);
  useEffect(() => {
    if (user) return;
    const stored = localStorage.getItem("voyage-user");
    if (stored) { try { setUser(JSON.parse(stored)); } catch (e) { console.error(e); } }
  }, [user]);

  // Load initial data
  useEffect(() => { if (agencyId) loadInitialThreads(); }, [agencyId]);

  // Context management
  useEffect(() => {
    if (!Array.isArray(agencyTrips) || agencyTrips.length === 0) {
      if (activeContext?.type === "trip") setActiveContext(null);
      return;
    }
    if (activeContext?.type === "draft") return;
    const hasCurrent = agencyTrips.some(t => t?.id === activeContext?.id);
    if (!hasCurrent) setActiveContext(createPlanningContext("trip", agencyTrips[0]?.id ?? null));
  }, [activeContext, agencyTrips]);

  useEffect(() => {
    if (!agencyId || activeContext?.type !== "trip" || !activeContext.id) return;
    ensureTripThreadState(activeContext.id).catch(e => console.error(e));
  }, [activeContext, agencyId]);

  // Stream updates handling (Keeping this here for now as it couples with useAgentRunStream and UI states)
  useEffect(() => {
    if (runStatus !== "completed" || !assistantMessage || !runTargetRef.current) return;
    const runTarget = parseRunTargetKey(runTargetRef.current);
    if (!runTarget) return;

    const update = (prev) => {
      const current = prev[runTarget.id] || { messages: [], loaded: false };
      if (current.messages.some(m => m.role === "assistant" && m.content.trim() === assistantMessage.trim())) return prev;
      return { ...prev, [runTarget.id]: { ...current, loaded: true, messages: [...current.messages, { id: `assistant-${Date.now()}`, role: "assistant", content: assistantMessage }] } };
    };

    if (runTarget.type === "draft") setDraftThreadStates(update);
    else setTripStates(update);
  }, [runStatus, assistantMessage]);

  useEffect(() => {
    if (!agencyId || !lastItineraryUpdate || !runTargetRef.current) return;
    const runTarget = parseRunTargetKey(runTargetRef.current);
    if (!runTarget) return;

    fetchItineraryDraft(agencyId, lastItineraryUpdate).then(res => {
      const itinerary = res?.itinerary ?? res ?? null;
      const update = (prev) => ({ ...prev, [runTarget.id]: { ...(prev[runTarget.id] || {}), itinerary, loaded: true } });
      if (runTarget.type === "draft") setDraftThreadStates(update);
      else setTripStates(update);
    }).catch(e => console.error(e));
  }, [agencyId, lastItineraryUpdate]);

  // UI state derivation
  const safeTrips = Array.isArray(agencyTrips) ? agencyTrips : [];
  const activeTrip = activeContext?.type === "trip" ? safeTrips.find(t => t?.id === activeContext.id) : null;
  const activeTripState = activeContext?.type === "draft" ? draftThreadStates[activeContext.id] : (activeTrip?.id ? tripStates[activeTrip.id] : null);

  const planningOptions = useMemo(() => {
    const drafts = draftThreadOrder.map((id, i) => {
      const s = draftThreadStates[id];
      if (!s) return null;
      const label = s.title || `Draft itinerary ${draftThreadOrder.length - i}`;
      return { type: "draft", id, clientName: label, label, destination: s.itinerary?.trip?.destination || "Planning draft", statusLabel: "Draft itinerary", threadId: id };
    }).filter(Boolean);

    const trips = safeTrips.map(t => ({
      type: "trip", id: t.id, clientName: t.clientName, label: t.clientName, destination: t.destination, statusLabel: t.approvalStatus || t.status || "Client trip", tripId: t.id, threadId: tripStates[t.id]?.threadId ?? null, assignedOrganizer: t.assignedOrganizer
    }));
    return [...drafts, ...trips];
  }, [draftThreadOrder, draftThreadStates, safeTrips, tripStates]);

  const activeOption = useMemo(() => activeContext ? planningOptions.find(o => o.type === activeContext.type && o.id === activeContext.id) : planningOptions[0], [activeContext, planningOptions]);
  
  const activeContextKey = createRunTargetKey(activeContext);
  const isVisible = Boolean(activeContextKey && activeContextKey === runTargetRef.current);
  const liveStatus = getRunStatusLabel(isVisible ? runStatus : "idle", isVisible ? streamError : null);
  const visibleMapMarkers = isVisible ? mapMarkers : [];
  const visibleRouteEstimates = isVisible ? routeEstimates : [];
  const placeEntities = useMemo(
    () => buildPlaceEntities({ itinerary: activeTripState?.itinerary ?? null, liveMarkers: visibleMapMarkers }),
    [activeTripState?.itinerary, visibleMapMarkers],
  );

  useEffect(() => {
    setSelectedPlaceId("");
  }, [activeContextKey]);

  useEffect(() => {
    if (!selectedPlaceId) return;
    if (!placeEntities.some((place) => place.id === selectedPlaceId)) {
      setSelectedPlaceId("");
    }
  }, [placeEntities, selectedPlaceId]);

  // Actions
  const handleNewItinerary = () => { onNewItinerary?.(); setActiveContext(null); /* useTripPlanning handles creation when message sent */ };

  const handleDeleteOption = async (option) => {
    const threadId = option?.threadId;
    if (!agencyId || !threadId || deletingThreadId) return;
    setDeletingThreadId(threadId);
    try {
      await deleteAgentThread(agencyId, threadId);
      if (option.type === "draft") {
        setDraftThreadStates(prev => { const n = { ...prev }; delete n[option.id]; return n; });
        setDraftThreadOrder(prev => prev.filter(id => id !== option.id));
      } else if (option.tripId) {
        setTripStates(prev => { const n = { ...prev }; delete n[option.tripId]; return n; });
      }
      if (runTargetRef.current === createRunTargetKey(option)) runTargetRef.current = null;
      if (selectedPlaceId) setSelectedPlaceId("");
      if (option.type === "draft" && activeContext?.id === option.id) {
        const next = planningOptions.find(o => !(o.type === option.type && o.id === option.id));
        setActiveContext(next ? createPlanningContext(next.type, next.id) : null);
      }
    } catch (e) { console.error(e); setAgentError(e.message); } finally { setDeletingThreadId(null); }
  };

  const submitDraftApproval = async (fields) => {
    if (!agencyId || activeContext?.type !== "draft") return;
    const threadId = activeContext.id;
    const itineraryId = draftThreadStates[threadId]?.itinerary?.id;
    if (!itineraryId) { setApprovalError("Generate an itinerary before saving this draft."); return; }

    setIsApprovingDraft(true); setApprovalError("");
    try {
      const res = await approveAgentThreadItinerary(agencyId, threadId, { itineraryId, ...fields });
      const approved = res?.thread || res?.trip || {};
      setDraftThreadStates(prev => ({ ...prev, [threadId]: { ...(prev[threadId] || {}), title: approved.title || approved.clientName || fields.clientName, tripId: approved.tripId || approved.id } }));
      setIsApprovalModalOpen(false);
    } catch (e) { setApprovalError(e.message); } finally { setIsApprovingDraft(false); }
  };

  return (
    <div className="voyage-dashboard-layout">
      {isApprovalModalOpen && activeContext?.type === "draft" && (
        <ApproveItineraryModal
          itinerary={activeTripState?.itinerary ?? null}
          isSaving={isApprovingDraft}
          error={approvalError}
          onCancel={() => { if (!isApprovingDraft) { setIsApprovalModalOpen(false); setApprovalError(""); } }}
          onSubmit={submitDraftApproval}
        />
      )}
      
      <DashboardHeader 
        isSidebarOpen={isSidebarOpen} 
        setIsSidebarOpen={setIsSidebarOpen}
        liveStatus={liveStatus}
        scopedStreamError={isVisible ? streamError : null}
        scopedIsStreaming={isVisible ? isStreaming : false}
        getInitials={getInitials}
        displayName={user?.displayName || "Traveler"}
        agencyId={agencyId}
      />

      <div className="voyage-body">
        <DashboardSidebar 
          isSidebarOpen={isSidebarOpen} 
          setIsSidebarOpen={setIsSidebarOpen}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          logout={logout}
        />

        <main className="voyage-main-content">
          {activeTab === "command-center" ? (
            <section className="hero-stack">
              <div className="agentic-surface">
                <AgentCommandCenter
                  messages={activeTripState?.messages ?? []}
                  isStreaming={isVisible ? isStreaming : false}
                  assistantMessage={isVisible ? assistantMessage : ""}
                  toolCalls={isVisible ? toolCalls : []}
                  activeToolLabel={isVisible ? activeToolLabel : null}
                  dispatchAgentMessage={(prompt) => dispatchMessage(prompt, startStream)}
                  composerInput={composerInput}
                  setComposerInput={setComposerInput}
                  isSending={isSending}
                  agentError={agentError}
                  user={user}
                  activeOption={activeOption}
                  planningOptions={planningOptions}
                  onNewItinerary={handleNewItinerary}
                  onPlanningOptionDelete={handleDeleteOption}
                  onPlanningOptionChange={(ctx) => { setActiveContext(createPlanningContext(ctx?.type, ctx?.id)); setComposerInput(""); }}
                  canApproveDraft={activeContext?.type === "draft" && Boolean(activeTripState?.itinerary?.id)}
                  onApproveDraft={() => { setApprovalError(""); setIsApprovalModalOpen(true); }}
                  isCreatingDraftThread={isCreatingDraftThread}
                  deletingThreadId={deletingThreadId}
                  placeEntities={placeEntities}
                  selectedPlaceId={selectedPlaceId}
                  onPlaceSelect={setSelectedPlaceId}
                />
                <ItineraryDraftPanel
                  itinerary={activeTripState?.itinerary ?? null}
                  draftDays={Array.isArray(activeTripState?.itinerary?.days) ? activeTripState.itinerary.days : []}
                  draftVersion={activeTripState?.itinerary?.version ? `Draft v${activeTripState.itinerary.version}` : "Draft unavailable"}
                  tripSummary={activeTripState?.itinerary?.trip ?? null}
                  mapMarkers={visibleMapMarkers}
                  routeEstimates={visibleRouteEstimates}
                  placeEntities={placeEntities}
                  selectedPlaceId={selectedPlaceId}
                  onPlaceSelect={setSelectedPlaceId}
                  onContinue={onContinue}
                  dispatchAgentMessage={(prompt) => dispatchMessage(prompt, startStream)}
                />
              </div>
            </section>
          ) : activeTab === "itineraries" ? (
            <ClientItineraryPage agencyTrips={agencyTrips} agencyId={agencyId} />
          ) : null}
        </main>
      </div>

    </div>
  );
}

// Internal helper for parsing run target key (could move to hook)
function parseRunTargetKey(key) {
  if (typeof key !== "string") return null;
  const idx = key.indexOf(":");
  if (idx <= 0) return null;
  return { type: key.slice(0, idx), id: key.slice(idx + 1) };
}
