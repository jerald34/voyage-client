// Effects that wire useAgentRunStream output into trip/draft thread state.
import { useEffect, useRef } from "react";
import { fetchItineraryDraft } from "../lib/api/index.js";

function parseRunTargetKey(key) {
  if (typeof key !== "string") return null;
  const idx = key.indexOf(":");
  if (idx <= 0) return null;
  return { type: key.slice(0, idx), id: key.slice(idx + 1) };
}

function shouldApplyItineraryFetchResult({
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

export function useAgentStreamOrchestration({
  agencyId,
  runStatus,
  completedMessageContent,
  assistantMessage,
  lastItineraryUpdate,
  streamingItinerary,
  runTargetRef,
  setTripStates,
  setDraftThreadStates,
}) {
  const completedAssistantMessageRef = useRef(null);
  const itineraryFetchSequenceRef = useRef(0);

  useEffect(() => {
    if (runStatus === "running") {
      completedAssistantMessageRef.current = null;
    }
  }, [runStatus]);

  useEffect(() => {
    if (runStatus !== "completed" || !runTargetRef.current) return;
    const finalContent = (completedMessageContent ?? assistantMessage ?? "").trim();
    if (!finalContent) return;
    const targetKey = runTargetRef.current;
    const runTarget = parseRunTargetKey(targetKey);
    if (!runTarget) return;

    const update = (prev) => {
      const current = prev[runTarget.id] || { messages: [], loaded: false };
      if (current.messages.some(m => m.role === "assistant" && m.content.trim() === finalContent)) return prev;
      completedAssistantMessageRef.current = { targetKey, content: finalContent };
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

  useEffect(() => {
    // Only merge streaming itinerary while the run is active. After
    // completion the REST fetch provides fully enriched data (photos,
    // ratings) — re-merging the stale streaming state would overwrite it.
    if (!streamingItinerary || !runTargetRef.current || runStatus !== "running") return;
    const targetKey = runTargetRef.current;
    const runTarget = parseRunTargetKey(targetKey);
    if (!runTarget) return;

    const update = (prev) => {
      const current = prev[runTarget.id] || {};
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
  }, [streamingItinerary, runStatus]);

  useEffect(() => {
    if (!agencyId || !lastItineraryUpdate || !runTargetRef.current) return;
    // Skip redundant REST fetches while the agent is streaming — SSE reducers
    // already apply live updates. The single fetch on run.completed still fires
    // because runStatus changing triggers this effect.
    if (runStatus === "running") return;
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
  }, [agencyId, lastItineraryUpdate, runStatus]);

  return { completedAssistantMessageRef };
}
