import { useEffect, useRef, useState } from "react";
import {
  createAgentThread,
  fetchAgentThread,
  fetchItineraryDraft,
  listAgentThreads,
  sendMessage,
} from "../lib/api.js";

function createPlanningContext(type, id) {
  if (!id || (type !== "trip" && type !== "draft")) return null;
  return { type, id };
}

function createRunTargetKey(context) {
  if (!context?.type || !context?.id) return null;
  return `${context.type}:${context.id}`;
}

function toUiRole(role) {
  if (role === "USER") return "user";
  if (role === "ASSISTANT") return "assistant";
  return "system";
}

export function isLikelyItineraryAssistantContent(content) {
  const text = String(content ?? "").trim();
  if (!text) return false;

  return (
    /\bitinerary draft\b/i.test(text) ||
    /\bitinerary title\s*:/i.test(text) ||
    /\btrip title\s*:/i.test(text) ||
    /(^|\n)\s*#{1,4}\s*day\s+\d+\b/i.test(text) ||
    /(^|\n)\s*day\s+\d+\s*[–\-:]/i.test(text) ||
    /\|\s*(time|order)\s*\|\s*(activity|description)/i.test(text)
  );
}

export function normalizeThreadMessages(thread, itineraryId = null) {
  const normalized = Array.isArray(thread?.messages)
    ? thread.messages
      .filter((message) => message?.role === "USER" || message?.role === "ASSISTANT")
      .map((message) => ({
        id: message.id,
        role: toUiRole(message.role),
        content: message.content,
        ...(message.itineraryId ? { itineraryId: message.itineraryId } : {}),
        ...(message.metadata?.itineraryId ? { metadata: { itineraryId: message.metadata.itineraryId } } : {}),
      }))
    : [];

  const targetItineraryId = String(itineraryId ?? thread?.itineraryId ?? "").trim();
  if (!targetItineraryId) return normalized;

  for (let index = normalized.length - 1; index >= 0; index -= 1) {
    const message = normalized[index];
    if (message?.role === "assistant" && isLikelyItineraryAssistantContent(message.content)) {
      return normalized.map((item, itemIndex) => (
        itemIndex === index ? { ...item, itineraryId: targetItineraryId } : item
      ));
    }
  }

  return normalized;
}

function getThreadTripId(thread) {
  return thread?.tripId ?? thread?.trip?.id ?? thread?.context?.tripId ?? thread?.metadata?.tripId ?? null;
}

function getThreadItineraryId(thread) {
  const events = Array.isArray(thread?.events) ? thread.events : [];
  const itineraryUpdateEvent = [...events]
    .reverse()
    .find((event) => event?.type === "itinerary.updated" && event?.payload?.itineraryId);

  return itineraryUpdateEvent?.payload?.itineraryId ?? null;
}

function normalizeItineraryResponse(responseData) {
  return responseData?.itinerary ?? responseData ?? null;
}

function normalizeDraftThreadState(thread, itinerary = null) {
  if (!thread?.id) return null;

  return {
    threadId: thread.id,
    title: String(thread.title ?? thread.name ?? "").trim(),
    tripId: null,
    messages: normalizeThreadMessages(thread, getThreadItineraryId(thread)),
    itinerary,
    loaded: true,
  };
}

export function useTripPlanning(agencyId) {
  const [activeContext, setActiveContext] = useState(null);
  const [tripStates, setTripStates] = useState({});
  const [draftThreadStates, setDraftThreadStates] = useState({});
  const [draftThreadOrder, setDraftThreadOrder] = useState([]);
  const [isSending, setIsSending] = useState(false);
  const [isCreatingDraftThread, setIsCreatingDraftThread] = useState(false);
  const [agentError, setAgentError] = useState("");

  const activeContextRef = useRef(activeContext);
  const tripStatesRef = useRef(tripStates);
  const draftThreadStatesRef = useRef(draftThreadStates);
  const tripStatePromisesRef = useRef(new Map());
  const hasLoadedInitialThreadRef = useRef(false);
  const runTargetRef = useRef(null);

  useEffect(() => {
    activeContextRef.current = activeContext;
  }, [activeContext]);

  useEffect(() => {
    tripStatesRef.current = tripStates;
  }, [tripStates]);

  useEffect(() => {
    draftThreadStatesRef.current = draftThreadStates;
  }, [draftThreadStates]);

  const ensureTripThreadState = async (tripId) => {
    if (!agencyId || !tripId) return null;

    const existingState = tripStatesRef.current[tripId];
    if (existingState?.loaded) return existingState;

    const pending = tripStatePromisesRef.current.get(tripId);
    if (pending) return pending;

    const promise = (async () => {
      const threadsResult = await listAgentThreads(agencyId);
      const threads = Array.isArray(threadsResult?.threads) ? threadsResult.threads : [];
      const matchingThread = threads.find((thread) => getThreadTripId(thread) === tripId);

      let thread = matchingThread ?? null;
      if (thread?.id) {
        const detailResult = await fetchAgentThread(agencyId, thread.id);
        thread = detailResult?.thread ?? thread;
      } else {
        const createdResult = await createAgentThread(agencyId, tripId);
        thread = createdResult?.thread ?? null;
      }

      if (!thread) return null;

      const itineraryId = getThreadItineraryId(thread);
      const itineraryResult = itineraryId ? await fetchItineraryDraft(agencyId, itineraryId) : null;
      const itinerary = itineraryResult ? normalizeItineraryResponse(itineraryResult) : null;
      const nextState = {
        threadId: thread.id,
        messages: normalizeThreadMessages(thread, itineraryId),
        itinerary,
        loaded: true,
      };

      setTripStates((previous) => ({
        ...previous,
        [tripId]: nextState,
      }));

      return nextState;
    })();

    tripStatePromisesRef.current.set(tripId, promise);

    try {
      return await promise;
    } finally {
      tripStatePromisesRef.current.delete(tripId);
    }
  };

  const createDraftThread = async () => {
    if (!agencyId) return null;

    setIsCreatingDraftThread(true);
    try {
      const createdResult = await createAgentThread(agencyId);
      const thread = createdResult?.thread ?? null;
      if (!thread?.id) return null;

      const itineraryId = getThreadItineraryId(thread);
      const itineraryResult = itineraryId ? await fetchItineraryDraft(agencyId, itineraryId) : null;
      const itinerary = itineraryResult ? normalizeItineraryResponse(itineraryResult) : null;
      const nextState = normalizeDraftThreadState(thread, itinerary);
      if (!nextState) return null;

      setDraftThreadStates((previous) => ({
        ...previous,
        [thread.id]: nextState,
      }));
      setDraftThreadOrder((previous) => [thread.id, ...previous.filter((id) => id !== thread.id)]);

      return nextState;
    } finally {
      setIsCreatingDraftThread(false);
    }
  };

  const loadInitialThreads = async () => {
    if (!agencyId || hasLoadedInitialThreadRef.current) return;
    hasLoadedInitialThreadRef.current = true;

    try {
      const threadsResult = await listAgentThreads(agencyId);
      const threads = Array.isArray(threadsResult?.threads) ? threadsResult.threads.filter((thread) => thread?.id) : [];
      if (threads.length === 0) return;

      const nextTripStates = {};
      const nextDraftStates = {};
      const nextDraftOrder = [];
      let fallbackContext = null;

      for (const listedThread of threads) {
        let thread = listedThread;
        const detailResult = await fetchAgentThread(agencyId, listedThread.id);
        thread = detailResult?.thread ?? thread;
        if (!thread?.id) continue;

        const tripId = getThreadTripId(thread);
        const itineraryId = getThreadItineraryId(thread);
        const itineraryResult = itineraryId ? await fetchItineraryDraft(agencyId, itineraryId) : null;
        const itinerary = itineraryResult ? normalizeItineraryResponse(itineraryResult) : null;

        if (tripId) {
          nextTripStates[tripId] = {
            threadId: thread.id,
            messages: normalizeThreadMessages(thread, itineraryId),
            itinerary,
            loaded: true,
          };
          fallbackContext ??= createPlanningContext("trip", tripId);
          continue;
        }

        const draftState = normalizeDraftThreadState(thread, itinerary);
        if (!draftState) continue;

        nextDraftStates[thread.id] = draftState;
        nextDraftOrder.push(thread.id);
        fallbackContext ??= createPlanningContext("draft", thread.id);
      }

      if (Object.keys(nextTripStates).length > 0) {
        setTripStates((previous) => ({ ...previous, ...nextTripStates }));
      }

      if (Object.keys(nextDraftStates).length > 0) {
        setDraftThreadStates((previous) => ({ ...previous, ...nextDraftStates }));
        setDraftThreadOrder((previous) => {
          const existing = previous.filter((threadId) => !nextDraftOrder.includes(threadId));
          return [...nextDraftOrder, ...existing];
        });
      }

      if (!activeContextRef.current && fallbackContext) {
        setActiveContext(fallbackContext);
      }
    } catch (error) {
      console.error("Failed to load latest agent thread", error);
    }
  };

  const dispatchMessage = async (content, startStream) => {
    if (!agencyId) {
      setAgentError("Missing agency context. Refresh and log in again.");
      return;
    }
    const cleanContent = content.trim();
    if (!cleanContent || isSending) return;

    setAgentError("");
    setIsSending(true);

    try {
      let currentContext = activeContextRef.current;
      let ensuredState = null;

      if (!currentContext) {
        ensuredState = await createDraftThread();
        currentContext = createPlanningContext("draft", ensuredState?.threadId ?? null);
        setActiveContext(currentContext);
      } else if (currentContext.type === "draft") {
        ensuredState = draftThreadStatesRef.current[currentContext.id] ?? null;
      } else {
        ensuredState = await ensureTripThreadState(currentContext.id);
      }

      const currentThreadId = ensuredState?.threadId;
      if (!currentThreadId) throw new Error("Failed to create agent thread.");

      runTargetRef.current = createRunTargetKey(currentContext);

      // Optimistic update
      const message = { id: `user-${Date.now()}`, role: "user", content: cleanContent };
      if (currentContext.type === "draft") {
        setDraftThreadStates((prev) => ({
          ...prev,
          [currentContext.id]: {
            ...(prev[currentContext.id] || {}),
            messages: [...(prev[currentContext.id]?.messages || []), message],
          },
        }));
      } else {
        setTripStates((prev) => ({
          ...prev,
          [currentContext.id]: {
            ...(prev[currentContext.id] || {}),
            messages: [...(prev[currentContext.id]?.messages || []), message],
          },
        }));
      }

      const sendResult = await sendMessage(agencyId, currentThreadId, cleanContent);
      const runId = sendResult?.runId || sendResult?.run?.id;
      if (runId && startStream) startStream(runId);
    } catch (error) {
      console.error("Failed to send agent message", error);
      setAgentError(error?.message || "Unable to send your request to Voyage Agent.");
    } finally {
      setIsSending(false);
    }
  };

  return {
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
    createDraftThread,
    loadInitialThreads,
    dispatchMessage,
    createPlanningContext,
    createRunTargetKey,
  };
}
