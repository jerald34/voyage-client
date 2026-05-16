import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTheme } from "../theme/ThemeProvider";
import { useAuth } from "../../hooks/useAuth.js";
import { useAgentRunStream } from "../../hooks/useAgentRunStream.js";
import { useTripPlanning } from "../../hooks/useTripPlanning.js";
import {
  approveAgentThreadItinerary,
  deleteAgentThread,
  deleteAgencyTrip,
  fetchItineraryDraft,
  listAgencyTrips,
  fetchPendingCount,
  updateAgencySettings,
  updateCurrentUserProfile,
} from "../../lib/api.js";
import {
  getAgencyPortfolioSummary,
  getAgentPriorityQueue,
  getApprovalBlockers,
  getUrgentDepartures,
} from "../../lib/agency-dashboard/selectors.js";
import { buildPlaceEntities, getItineraryPlaceEntityId } from "../../lib/trip-dashboard/placeEntities.js";

import dynamic from "next/dynamic";
import AgentCommandCenter from "./command-center/AgentCommandCenter.jsx";
import ItineraryDraftPanel from "./itinerary/ItineraryDraftPanel.jsx";
const ItineraryLiveMap = dynamic(() => import("./itinerary/ItineraryLiveMap.jsx"), { ssr: false });
import ClientItineraryPage from "./pages/ClientItineraryPage.jsx";
import SettingsPage from "./pages/SettingsPage.jsx";
import ApproveItineraryModal from "./modals/ApproveItineraryModal.jsx";
import DashboardHeader from "./layout/DashboardHeader.jsx";
import DashboardSidebar from "./layout/DashboardSidebar.jsx";
import AdminAgenciesPage from "../admin/AdminAgenciesPage.jsx";
import MobileGlassSheet from "./mobile/MobileGlassSheet.jsx";
import useMobileViewport from "./mobile/useMobileViewport.js";
import ChatInput from "./command-center/ChatInput.jsx";
import FirstUseTutorial from "./tutorial/FirstUseTutorial.jsx";
import { VOYAGE_TOUR_STORAGE_KEY, voyageTourSteps } from "./tutorial/tutorialContent.js";

// Minimal UI helpers
const getInitials = (name) => {
  const parts = String(name ?? "").trim().split(/\s+/).filter(Boolean);
  return parts.length === 0 ? "VP" : parts.slice(0, 2).map(p => p[0]?.toUpperCase() ?? "").join("");
};

function mapTripStatus(dbStatus) {
  const s = String(dbStatus ?? "").toUpperCase();
  if (s === "APPROVED_INTERNAL") return "Approved";
  if (s === "IN_REVIEW") return "Awaiting itinerary approval";
  if (s === "ARCHIVED") return "Archived";
  return "Draft";
}

function formatTripDates(startDate, endDate) {
  if (!startDate) return "Dates pending";
  const fmt = (d) => {
    const date = new Date(d);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };
  if (!endDate) return fmt(startDate);
  return `${fmt(startDate)} - ${fmt(endDate)}`;
}

const getRunStatusLabel = (runStatus, streamError) => {
  if (streamError) return "Needs attention";
  if (runStatus === "completed") return "Idle";
  if (runStatus === "in_progress" || runStatus === "running") return "Agent streaming";
  return "Ready";
};

export function getAgencyMapFallbackFromUser(user) {
  const agency = Array.isArray(user?.memberships)
    ? user.memberships.find((membership) => membership?.agency)?.agency
    : null;
  if (!agency) return null;

  const city = String(agency.city ?? "").trim();
  const country = String(agency.country ?? "").trim();
  if (!city && !country) return null;

  return {
    name: agency.name,
    city,
    country,
  };
}

export default function HomePage({ user: userProp, agencyTrips: agencyTripsProp = [], onContinue, onOpenTrip, onNewItinerary }) {
  const { theme } = useTheme();
  const { logout } = useAuth();
  const [user, setUser] = useState(userProp || null);
  const agencyId = user?.memberships?.[0]?.agencyId ?? null;
  const [fetchedTrips, setFetchedTrips] = useState(null);
  const agencyTrips = agencyTripsProp;
  const savedTripsForPortfolio = fetchedTrips ?? [];

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
  const [isClientMenuOpen, setIsClientMenuOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [mobileMapPadding, setMobileMapPadding] = useState(0);
  const [isFirstUseTutorialOpen, setIsFirstUseTutorialOpen] = useState(false);
  const [activeTourSteps, setActiveTourSteps] = useState(voyageTourSteps);
  const [tourMobilePaneOverride, setTourMobilePaneOverride] = useState(null);
  const [tourGlassSheetSnap, setTourGlassSheetSnap] = useState(null);
  const [cipTourState, setCipTourState] = useState({
    hasSelectedClient: false,
    hasMultipleTrips: false,
    hasItineraryDays: false,
  });

  const visibleTourSteps = useMemo(() => {
    return voyageTourSteps.filter((step) => {
      if (step.target === "cip-trip-selector") return cipTourState.hasMultipleTrips;
      if (step.target === "cip-day-strip") return cipTourState.hasItineraryDays;
      if (step.target === "cip-actions") return cipTourState.hasSelectedClient;
      return true;
    });
  }, [cipTourState]);
  const isMobile = useMobileViewport();
  const clientMenuRef = useRef(null);
  const completedAssistantMessageRef = useRef(null);
  const mobileTextareaRef = useRef(null);

  // Poll pending count for admin users
  useEffect(() => {
    if (user?.role !== "ADMIN") return;
    let cancelled = false;
    const load = () => {
      fetchPendingCount()
        .then((data) => { if (!cancelled) setPendingCount(data.count || 0); })
        .catch(() => {});
    };
    load();
    const interval = setInterval(load, 60000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [user?.role]);

  const refreshPendingCount = () => {
    if (user?.role !== "ADMIN") return;
    fetchPendingCount()
      .then((data) => setPendingCount(data.count || 0))
      .catch(() => {});
  };

  const itineraryFetchSequenceRef = useRef(0);

  const {
    isStreaming,
    runStatus,
    assistantMessage,
    completedMessageContent,
    toolCalls,
    mapMarkers,
    routeEstimates,
    activeToolLabel,
    lastItineraryUpdate,
    streamingItinerary,
    error: streamError,
    startStream,
    stopStream,
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

  useEffect(() => {
    if (!user) return;
    const hasSeenTutorial = typeof window !== "undefined"
      && localStorage.getItem(VOYAGE_TOUR_STORAGE_KEY) === "true";
    if (!hasSeenTutorial) {
      // Snapshot steps at open time so the total count stays frozen during the tour.
      // cipTourState is all-false on first mount (Itineraries tab not yet visited),
      // so we include all steps to avoid hiding cip-* steps prematurely.
      setActiveTourSteps(voyageTourSteps);
      setIsFirstUseTutorialOpen(true);
    }
  }, [user]);

  const persistUser = useCallback((nextUserOrUpdater) => {
    setUser((currentUser) => {
      const nextUser = typeof nextUserOrUpdater === "function"
        ? nextUserOrUpdater(currentUser)
        : nextUserOrUpdater;
      if (typeof window !== "undefined" && nextUser) {
        localStorage.setItem("voyage-user", JSON.stringify(nextUser));
      }
      return nextUser;
    });
  }, []);

  const handleUserProfileUpdate = useCallback(async (payload) => {
    const result = await updateCurrentUserProfile(payload);
    if (result?.user) {
      persistUser(result.user);
    }
    return result;
  }, [persistUser]);

  const handleAgencySettingsUpdate = useCallback(async (payload) => {
    if (!agencyId) {
      throw new Error("Missing agency context. Refresh and log in again.");
    }
    const result = await updateAgencySettings(agencyId, payload);
    const updatedAgency = result?.agency;
    if (updatedAgency) {
      persistUser((currentUser) => {
        if (!currentUser) return currentUser;
        return {
          ...currentUser,
          memberships: (currentUser?.memberships || []).map((membership) => (
            membership?.agencyId === agencyId
              ? { ...membership, agency: { ...membership.agency, ...updatedAgency } }
              : membership
          )),
        };
      });
    }
    return result;
  }, [agencyId, persistUser]);

  useEffect(() => {
    if (!agencyId) return;
    let cancelled = false;
    listAgencyTrips(agencyId)
      .then((res) => {
        if (cancelled) return;
        const trips = Array.isArray(res?.trips) ? res.trips : [];
        setFetchedTrips(
          trips.map((t) => {
            const firstItinerary = Array.isArray(t.itineraries) ? t.itineraries[0] : null;
            return {
              id: t.id,
              clientName: t.clientName ?? t.title,
              destination: t.destinationSummary ?? t.title,
              travelWindow: formatTripDates(t.startDate, t.endDate),
              status: t.status?.toLowerCase() === "archived" ? "archived" : "active",
              approvalStatus: mapTripStatus(t.status),
              itineraryId: firstItinerary?.id ?? null,
              itineraryVersion: firstItinerary?.version ?? null,
            };
          })
        );
      })
      .catch((err) => console.error("Failed to load agency trips:", err));
    return () => { cancelled = true; };
  }, [agencyId]);

  // Context management
  useEffect(() => {
    const hasPropTrips = Array.isArray(agencyTrips) && agencyTrips.length > 0;
    const hasThreadTrips = Object.keys(tripStates).length > 0;
    if (!hasPropTrips && !hasThreadTrips) {
      if (activeContext?.type === "trip") setActiveContext(null);
      return;
    }
    if (activeContext?.type === "draft") return;
    if (activeContext?.type === "trip") {
      const existsInProp = agencyTrips.some(t => t?.id === activeContext?.id);
      const existsInStates = Boolean(tripStates[activeContext?.id]);
      if (existsInProp || existsInStates) return;
    }
    if (hasPropTrips) setActiveContext(createPlanningContext("trip", agencyTrips[0]?.id ?? null));
  }, [activeContext, agencyTrips, tripStates]);

  useEffect(() => {
    if (!agencyId || activeContext?.type !== "trip" || !activeContext.id) return;
    ensureTripThreadState(activeContext.id).catch(e => console.error(e));
  }, [activeContext, agencyId]);

  // Clear stale refs from previous runs so they don't pollute the current
  // run's itinerary tagging logic. Without this, a greeting message from
  // run 1 would be wrongly tagged as the itinerary from run 2.
  useEffect(() => {
    if (runStatus === "running") {
      completedAssistantMessageRef.current = null;
    }
  }, [runStatus]);

  // Stream updates handling (Keeping this here for now as it couples with useAgentRunStream and UI states)
  useEffect(() => {
    if (runStatus !== "completed" || !runTargetRef.current) return;
    // Prefer the authoritative message.completed content over the accumulated
    // streaming deltas.  completedMessageContent is set from the
    // message.completed SSE event which carries the server-persisted assistant
    // response.  assistantMessage may still contain stale/concatenated deltas
    // from the initial model output + synthesis phases.
    const finalContent = (completedMessageContent ?? assistantMessage ?? "").trim();
    if (!finalContent) return;
    const targetKey = runTargetRef.current;
    const runTarget = parseRunTargetKey(targetKey);
    if (!runTarget) return;

    const update = (prev) => {
      const current = prev[runTarget.id] || { messages: [], loaded: false };
      if (current.messages.some(m => m.role === "assistant" && m.content.trim() === finalContent)) return prev;
      completedAssistantMessageRef.current = { targetKey, content: finalContent };
      // If an itinerary was created/updated during this run, tag this
      // message so it renders as the rich itinerary card.
      // lastItineraryUpdate is a React state value set by the
      // itinerary.updated SSE event and reset on each new stream, so
      // it is scoped to the current run and available in the same
      // render cycle — no ref timing issues.
      const itineraryId = lastItineraryUpdate ? String(lastItineraryUpdate) : "";
      const message = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: finalContent,
        ...(itineraryId ? { itineraryId } : {}),
      };
      return { ...prev, [runTarget.id]: { ...current, loaded: true, messages: [...current.messages, message] } };
    };

    if (runTarget.type === "draft") setDraftThreadStates(update);
    else setTripStates(update);
  }, [runStatus, completedMessageContent, assistantMessage, lastItineraryUpdate]);

  // While the agent is streaming granular events, mirror the in-flight itinerary into the active
  // trip/draft state so RichItineraryMessage and ItineraryDraftPanel re-render in real time.
  // The post-completion fetch below still runs for the canonical, place-snapshot-enriched copy.
  useEffect(() => {
    if (!streamingItinerary || !runTargetRef.current) return;
    const targetKey = runTargetRef.current;
    const runTarget = parseRunTargetKey(targetKey);
    if (!runTarget) return;

    const update = (prev) => {
      const current = prev[runTarget.id] || {};
      // Preserve any nested trip context the renderer expects, but replace days/title/summary as they stream.
      const merged = {
        ...(current.itinerary ?? {}),
        ...streamingItinerary,
      };
      return {
        ...prev,
        [runTarget.id]: {
          ...current,
          itinerary: merged,
          loaded: true,
          messages: current.messages || [],
        },
      };
    };
    if (runTarget.type === "draft") setDraftThreadStates(update);
    else setTripStates(update);
  }, [streamingItinerary]);

  useEffect(() => {
    if (!agencyId || !lastItineraryUpdate || !runTargetRef.current) return;
    itineraryFetchSequenceRef.current += 1;
    const requestSequence = itineraryFetchSequenceRef.current;
    const targetKey = runTargetRef.current;
    const runTarget = parseRunTargetKey(targetKey);
    if (!runTarget) return;
    let isCancelled = false;

    fetchItineraryDraft(agencyId, lastItineraryUpdate).then(res => {
      if (
        isCancelled ||
        !shouldApplyItineraryFetchResult({
          requestSequence,
          latestSequence: itineraryFetchSequenceRef.current,
          requestTargetKey: targetKey,
          currentTargetKey: runTargetRef.current,
        })
      ) {
        return;
      }

      const itinerary = res?.itinerary ?? res ?? null;
      const update = (prev) => {
        const current = prev[runTarget.id] || {};
        return {
          ...prev,
          [runTarget.id]: {
            ...current,
            itinerary,
            loaded: true,
            messages: current.messages || [],
          },
        };
      };
      if (runTarget.type === "draft") setDraftThreadStates(update);
      else setTripStates(update);
    }).catch(e => console.error(e));

    return () => {
      isCancelled = true;
    };
  }, [agencyId, lastItineraryUpdate]);

  // UI state derivation
  const safeTrips = Array.isArray(agencyTrips) ? agencyTrips : [];
  const activeTrip = activeContext?.type === "trip" ? safeTrips.find(t => t?.id === activeContext.id) : null;
  const activeTripState = activeContext?.type === "draft" ? draftThreadStates[activeContext.id] : (activeContext?.type === "trip" && activeContext.id ? tripStates[activeContext.id] : null);

  const planningOptions = useMemo(() => {
    const drafts = draftThreadOrder.map((id, i) => {
      const s = draftThreadStates[id];
      if (!s) return null;
      const label = s.title || `Draft itinerary ${draftThreadOrder.length - i}`;
      return { type: "draft", id, clientName: label, label, destination: s.itinerary?.trip?.destination || "Planning draft", statusLabel: "Draft itinerary", threadId: id };
    }).filter(Boolean);

    const propTripIds = new Set(safeTrips.map(t => t.id));
    const trips = safeTrips.map(t => ({
      type: "trip", id: t.id, clientName: t.clientName, label: t.clientName, destination: t.destination, statusLabel: t.approvalStatus || t.status || "Client trip", tripId: t.id, threadId: tripStates[t.id]?.threadId ?? null, assignedOrganizer: t.assignedOrganizer
    }));

    const threadOnlyTrips = Object.entries(tripStates)
      .filter(([tripId]) => !propTripIds.has(tripId))
      .map(([tripId, state]) => {
        const title = state.title || state.itinerary?.title || state.itinerary?.trip?.clientName || "Client trip";
        const dest = state.itinerary?.trip?.destination || state.itinerary?.trip?.destinationSummary || "";
        return { type: "trip", id: tripId, clientName: title, label: title, destination: dest, statusLabel: "Approved", tripId, threadId: state.threadId ?? null };
      });

    const options = [...drafts, ...trips, ...threadOnlyTrips];

    // If we are currently creating a draft thread, and activeContext is set to that pending ID,
    // add it to the options list so the switcher can identify it.
    if (activeContext?.type === "draft" && String(activeContext.id).startsWith("pending-")) {
      const isAlreadyInDrafts = drafts.some(d => d.id === activeContext.id);
      if (!isAlreadyInDrafts) {
        options.unshift({
          type: "draft",
          id: activeContext.id,
          clientName: "New Itinerary...",
          label: "New Itinerary...",
          destination: "Planning",
          statusLabel: "Creating...",
          threadId: null
        });
      }
    }

    return options;
  }, [draftThreadOrder, draftThreadStates, safeTrips, tripStates, activeContext]);

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
  const agencyMapFallback = useMemo(() => getAgencyMapFallbackFromUser(user), [user]);
  const activeMembership = useMemo(() => (
    Array.isArray(user?.memberships)
      ? user.memberships.find((membership) => membership?.agencyId === agencyId)
      : null
  ), [agencyId, user]);
  const activeAgency = activeMembership?.agency ?? null;

  useEffect(() => {
    setSelectedPlaceId("");
  }, [activeContextKey]);

  const handleMobileSnapChange = useCallback((snap) => {
    const vh = window.visualViewport?.height ?? window.innerHeight;
    if (snap === "peek") setMobileMapPadding(120);
    else if (snap === "half") setMobileMapPadding(Math.round(vh * 0.55));
    else setMobileMapPadding(Math.round(vh * 0.9));
  }, []);

  const closeFirstUseTutorial = useCallback(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(VOYAGE_TOUR_STORAGE_KEY, "true");
    }
    setIsFirstUseTutorialOpen(false);
    setTourMobilePaneOverride(null);
    setTourGlassSheetSnap(null);
  }, []);

  const replayFirstUseTutorial = useCallback(() => {
    setActiveTab("command-center");
    // Snapshot steps at replay time. If cipTourState already reflects a visited
    // Itineraries tab, use the filtered list; otherwise include all steps.
    const snapshot = cipTourState.hasSelectedClient
      ? voyageTourSteps.filter((step) => {
          if (step.target === "cip-trip-selector") return cipTourState.hasMultipleTrips;
          if (step.target === "cip-day-strip") return cipTourState.hasItineraryDays;
          return true;
        })
      : voyageTourSteps;
    setActiveTourSteps(snapshot);
    setIsFirstUseTutorialOpen(true);
  }, [cipTourState]);

  const handleFirstUseTutorialStepChange = useCallback((step) => {
    if (step?.tab) {
      setActiveTab((current) => (current === step.tab ? current : step.tab));
    }
    // Drive ClientItineraryPage's mobile pane so detail-pane targets exist
    // when their step appears on mobile.
    if (step?.target === "cip-client-directory") {
      setTourMobilePaneOverride("list");
    } else if (
      step?.target === "cip-workspace" ||
      step?.target === "cip-trip-selector" ||
      step?.target === "cip-day-strip" ||
      step?.target === "cip-actions"
    ) {
      setTourMobilePaneOverride("detail");
    } else {
      setTourMobilePaneOverride(null);
    }
    // Drive the Command Center's mobile glass sheet so the right surface is
    // visible for each step on mobile.
    if (step?.target === "workspace-chat") {
      setTourGlassSheetSnap("half");
    } else if (step?.target === "workspace-map") {
      setTourGlassSheetSnap("peek");
    } else {
      setTourGlassSheetSnap(null);
    }
    if (step?.target === "settings-replay") {
      setIsSidebarOpen(true);
    }
  }, []);

  function handleMobileKeyDown(event) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      if (composerInput.trim() && !isSending) {
        handleMobileSubmit(event);
      }
    }
  }

  function handleMobileSubmit(event) {
    event.preventDefault();
    if (!composerInput.trim()) return;
    void dispatchMessage(composerInput, startStream);
    setComposerInput("");
  }

  const activeTripClientName = String(activeOption?.clientName ?? activeOption?.label ?? "").trim();
  const activeTripInitials = activeTripClientName ? getInitials(activeTripClientName) : "";
  const activeTripOrganizerInitials = activeOption?.assignedOrganizer ? getInitials(activeOption.assignedOrganizer) : "";
  const clientMenuEmptyTitle = "No client trips available";
  const clientMenuEmptyBody = "Use New Itinerary to create the first trip.";

  useEffect(() => {
    function handleOutsideClick(event) {
      if (!clientMenuRef.current) return;
      if (!clientMenuRef.current.contains(event.target)) {
        setIsClientMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);


  // Actions
  const handleNewItinerary = async () => {
    // Reset to "command-center" tab so user sees the new draft being created
    setActiveTab("command-center");
    
    // Set a placeholder context to immediately transition the UI to a "creating" state
    // and avoid race conditions where the UI might try to render a null context.
    const placeholderId = `pending-${Date.now()}`;
    setActiveContext({ type: "draft", id: placeholderId });
    
    if (onNewItinerary) {
      await onNewItinerary();
    }
  };

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
      if (activeContext?.type === option.type && activeContext?.id === option.id) {
        const next = getNextPlanningContextAfterDelete(planningOptions, option);
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
      const tripId = approved.tripId || approved.id;
      const draftState = draftThreadStates[threadId] || {};

      if (tripId) {
        setTripStates(prev => ({
          ...prev,
          [tripId]: {
            ...draftState,
            threadId,
            title: approved.title || approved.clientName || fields.clientName,
            tripId,
            loaded: true,
          },
        }));
        setDraftThreadStates(prev => { const next = { ...prev }; delete next[threadId]; return next; });
        setDraftThreadOrder(prev => prev.filter(id => id !== threadId));
        setActiveContext(createPlanningContext("trip", tripId));
      }

      listAgencyTrips(agencyId)
        .then((r) => {
          const trips = Array.isArray(r?.trips) ? r.trips : [];
          setFetchedTrips(
            trips.map((t) => {
              const firstItinerary = Array.isArray(t.itineraries) ? t.itineraries[0] : null;
              return {
                id: t.id,
                clientName: t.clientName ?? t.title,
                destination: t.destinationSummary ?? t.title,
                travelWindow: formatTripDates(t.startDate, t.endDate),
                status: t.status?.toLowerCase() === "archived" ? "archived" : "active",
                approvalStatus: mapTripStatus(t.status),
                itineraryId: firstItinerary?.id ?? null,
                itineraryVersion: firstItinerary?.version ?? null,
              };
            })
          );
        })
        .catch((err) => console.error("Failed to refresh agency trips:", err));

      setIsApprovalModalOpen(false);
    } catch (e) { setApprovalError(e.message); } finally { setIsApprovingDraft(false); }
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-background text-text-primary font-sans">
      <FirstUseTutorial
        open={isFirstUseTutorialOpen}
        onClose={closeFirstUseTutorial}
        onStepChange={handleFirstUseTutorialStepChange}
        steps={activeTourSteps}
      />

      {isApprovalModalOpen && activeContext?.type === "draft" && (
        <ApproveItineraryModal
          itinerary={activeTripState?.itinerary ?? null}
          isSaving={isApprovingDraft}
          error={approvalError}
          onCancel={() => { if (!isApprovingDraft) { setIsApprovalModalOpen(false); setApprovalError(""); } }}
          onSubmit={submitDraftApproval}
        />
      )}

      <div>
        <DashboardHeader
          isSidebarOpen={isSidebarOpen}
          setIsSidebarOpen={setIsSidebarOpen}
          liveStatus={liveStatus}
          scopedStreamError={isVisible ? streamError : null}
          scopedIsStreaming={isVisible ? isStreaming : false}
          getInitials={getInitials}
          displayName={user?.displayName || "Traveler"}
          agencyId={agencyId}
          activeTab={activeTab}
          onNewItinerary={handleNewItinerary}
          isCreatingDraftThread={isCreatingDraftThread}
          isClientMenuOpen={isClientMenuOpen}
          setIsClientMenuOpen={setIsClientMenuOpen}
          clientMenuRef={clientMenuRef}
          hasOptions={planningOptions.length > 0}
          activeTripClientName={activeTripClientName}
          activeTripInitials={activeTripInitials}
          activeTripOrganizerInitials={activeTripOrganizerInitials}
          clientMenuEmptyTitle={clientMenuEmptyTitle}
          clientMenuEmptyBody={clientMenuEmptyBody}
          safeOptions={activeTab === "itineraries" ? planningOptions.filter(o => o.type !== "draft") : planningOptions}
          activeOption={activeOption}
          onPlanningOptionDelete={handleDeleteOption}
          deletingThreadId={deletingThreadId}
          onPlanningOptionChange={(ctx) => { setActiveContext(createPlanningContext(ctx?.type, ctx?.id)); setComposerInput(""); }}
          canApproveDraft={activeContext?.type === "draft" && Boolean(activeTripState?.itinerary?.id)}
          onApproveDraft={() => { setApprovalError(""); setIsApprovalModalOpen(true); }}
        />
      </div>

      <div className="flex flex-1 overflow-hidden relative">
        <DashboardSidebar
          isSidebarOpen={isSidebarOpen}
          setIsSidebarOpen={setIsSidebarOpen}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          logout={logout}
          user={user}
          pendingCount={pendingCount}
        />

        <main className="flex-1 overflow-y-auto p-2 flex flex-col gap-2 max-[900px]:p-0 max-[900px]:overflow-hidden">
          {activeTab === "command-center" ? (
            <section
              data-tour-target="workspace"
              className="relative flex flex-1 min-h-0 overflow-hidden rounded-[24px] border border-border/10 shadow-inner max-[900px]:rounded-none max-[900px]:border-none max-[900px]:shadow-none"
            >
              {/* Immersive Map Background */}
              <div
                data-tour-target="workspace-map"
                className="absolute inset-0 z-0 opacity-90 transition-opacity duration-700 hover:opacity-100"
              >
                <ItineraryLiveMap
                  theme={theme}
                  agencyLocation={agencyMapFallback}
                  items={activeTripState?.itinerary?.days?.reduce((acc, day) => {
                    (day?.items || []).forEach((item, idx) => acc.push({
                      ...item,
                      __dayNumber: day?.dayNumber,
                      __dayTitle: day?.title,
                      __itemIndex: idx,
                      __placeEntityId: getItineraryPlaceEntityId(item, day, idx),
                    }));
                    return acc;
                  }, []) ?? []}
                  liveMarkers={visibleMapMarkers}
                  routeEstimates={visibleRouteEstimates}
                  placeEntities={placeEntities}
                  selectedPlaceId={selectedPlaceId}
                  onSelectPlace={setSelectedPlaceId}
                  sidebarWidth={isMobile ? 0 : 520}
                  mapBottomPadding={isMobile ? mobileMapPadding : 0}
                />
              </div>

              {/* Desktop: Floating Glass Panels Layer */}
              <div className="relative z-10 flex gap-6 p-2 w-full h-full pointer-events-none overflow-hidden max-[900px]:hidden">
                <div
                  data-tour-target="workspace-chat"
                  className="w-full lg:w-[520px] h-full pointer-events-auto transition-all duration-500 ease-in-out"
                >
                  <AgentCommandCenter
                    messages={activeTripState?.messages ?? []}
                    isStreaming={isVisible ? isStreaming : false}
                    assistantMessage={isVisible ? assistantMessage : ""}
                    toolCalls={isVisible ? toolCalls : []}
                    activeToolLabel={isVisible ? activeToolLabel : null}
                    streamingItinerary={isVisible ? streamingItinerary : null}
                    dispatchAgentMessage={(prompt) => dispatchMessage(prompt, startStream)}
                    composerInput={composerInput}
                    setComposerInput={setComposerInput}
                    isSending={isSending}
                    agentError={agentError}
                    user={user}
                    itinerary={activeTripState?.itinerary ?? null}
                    placeEntities={placeEntities}
                    selectedPlaceId={selectedPlaceId}
                    onPlaceSelect={setSelectedPlaceId}
                    onStop={isVisible ? stopStream : undefined}
                  />
                </div>
              </div>

              {/* Mobile: Glass Sheet over map */}
              {isMobile && (
                <MobileGlassSheet
                  defaultSnap="half"
                  onSnapChange={handleMobileSnapChange}
                  forcedSnap={tourGlassSheetSnap}
                  data-tour-target="workspace-chat"
                  footer={
                    <ChatInput
                      textareaRef={mobileTextareaRef}
                      composerInput={composerInput}
                      setComposerInput={setComposerInput}
                      handleKeyDown={handleMobileKeyDown}
                      submitComposer={handleMobileSubmit}
                      isSending={isSending || (isVisible && isStreaming)}
                      agentError={agentError}
                      onStop={isVisible ? stopStream : undefined}
                      containerClassName="px-3 pb-3"
                    />
                  }
                >
                  <AgentCommandCenter
                    messages={activeTripState?.messages ?? []}
                    isStreaming={isVisible ? isStreaming : false}
                    assistantMessage={isVisible ? assistantMessage : ""}
                    toolCalls={isVisible ? toolCalls : []}
                    activeToolLabel={isVisible ? activeToolLabel : null}
                    streamingItinerary={isVisible ? streamingItinerary : null}
                    dispatchAgentMessage={(prompt) => dispatchMessage(prompt, startStream)}
                    composerInput={composerInput}
                    setComposerInput={setComposerInput}
                    isSending={isSending}
                    agentError={agentError}
                    user={user}
                    itinerary={activeTripState?.itinerary ?? null}
                    placeEntities={placeEntities}
                    selectedPlaceId={selectedPlaceId}
                    onPlaceSelect={setSelectedPlaceId}
                    onStop={isVisible ? stopStream : undefined}
                    hideChatInput
                  />
                </MobileGlassSheet>
              )}
            </section>
          ) : activeTab === "itineraries" ? (
            <ClientItineraryPage
              agencyTrips={savedTripsForPortfolio}
              agencyId={agencyId}
              onTourStateChange={setCipTourState}
              tourMobilePaneOverride={tourMobilePaneOverride}
              onDeleteTrip={async (aid, tripId) => {
                await deleteAgencyTrip(aid, tripId);
                setFetchedTrips(prev => (prev || []).filter(t => t.id !== tripId));
                if (tripStates[tripId]) {
                  setTripStates(prev => { const next = { ...prev }; delete next[tripId]; return next; });
                }
              }}
            />
          ) : activeTab === "settings" ? (
            <SettingsPage
              user={user}
              agency={activeAgency}
              membership={activeMembership}
              logout={logout}
              onUpdateProfile={handleUserProfileUpdate}
              onUpdateAgency={handleAgencySettingsUpdate}
              onReplayTutorial={replayFirstUseTutorial}
            />
          ) : activeTab === "admin" && user?.role === "ADMIN" ? (
            <AdminAgenciesPage onPendingCountChange={refreshPendingCount} />
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

export function tagAssistantMessageByCompletedContent(messages, itineraryId, completedAssistantMessage) {
  if (!itineraryId || !Array.isArray(messages) || messages.length === 0) {
    return Array.isArray(messages) ? messages : [];
  }

  const completedContent = String(completedAssistantMessage?.content ?? "").trim();
  if (!completedContent) return messages;

  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];
    if (message?.role === "assistant" && String(message?.content ?? "").trim() === completedContent) {
      return messages.map((item, itemIndex) => (
        itemIndex === index ? { ...item, itineraryId } : item
      ));
    }
  }

  return messages;
}

export function getNextPlanningContextAfterDelete(planningOptions, deletedOption) {
  const next = (Array.isArray(planningOptions) ? planningOptions : [])
    .find((option) => !(option?.type === deletedOption?.type && option?.id === deletedOption?.id));

  return next ? { type: next.type, id: next.id } : null;
}

export function shouldApplyItineraryFetchResult({
  requestSequence,
  latestSequence,
  requestTargetKey,
  currentTargetKey,
}) {
  return (
    requestSequence === latestSequence &&
    Boolean(requestTargetKey) &&
    requestTargetKey === currentTargetKey
  );
}

export function getAssistantMessageItineraryIdFromPendingTag({
  pendingTag,
  targetKey,
  completedContent,
}) {
  if (!pendingTag?.itineraryId || pendingTag?.targetKey !== targetKey) return "";
  const pendingContent = String(pendingTag.content ?? "").trim();
  const currentContent = String(completedContent ?? "").trim();
  return pendingContent && pendingContent === currentContent ? String(pendingTag.itineraryId) : "";
}
