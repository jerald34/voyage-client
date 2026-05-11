import { useEffect, useMemo, useRef, useState } from "react";
import ClientSwitcher from "./ClientSwitcher.jsx";
import ChatMessage from "./ChatMessage.jsx";
import ChatInput from "./ChatInput.jsx";
import RichItineraryMessage from "./RichItineraryMessage.jsx";

function getInitials(name) {
  const parts = String(name ?? "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) {
    return "VP";
  }

  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

const EMPTY_ARRAY = Object.freeze([]);

export default function AgentCommandCenter({
  messages,
  isStreaming,
  assistantMessage,
  toolCalls,
  dispatchAgentMessage,
  composerInput,
  setComposerInput,
  isSending,
  agentError,
  user,
  activeToolLabel = null,
  itinerary = null,
  placeEntities = [],
  selectedPlaceId = "",
  onPlaceSelect,
}) {
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);


  const displayedMessages = useMemo(() => {
    if (!Array.isArray(messages) || messages.length === 0) {
      return EMPTY_ARRAY;
    }
    return messages.slice(-12);
  }, [messages]);


  const hasStreamingBubble =
    isStreaming &&
    typeof assistantMessage === "string" &&
    assistantMessage.trim().length > 0 &&
    displayedMessages[displayedMessages.length - 1]?.content !== assistantMessage;

  const activeToolCalls = useMemo(() => {
    if (!isStreaming) {
      return EMPTY_ARRAY;
    }

    const recent = Array.isArray(toolCalls) ? [...toolCalls].slice(-4).reverse() : [];
    const uniqueNames = [];

    for (const call of recent) {
      if (!call?.name || uniqueNames.includes(call.name)) continue;
      uniqueNames.push(call.name);
      if (uniqueNames.length >= 3) break;
    }

    return uniqueNames;
  }, [isStreaming, toolCalls]);

  const userName = user?.displayName || "You";
  const userInitials = getInitials(userName);
  const itineraryId = itinerary?.id != null ? String(itinerary.id) : null;

  function shouldRenderMessageAsItinerary(message) {
    if (!itineraryId || message?.role !== "assistant") return false;
    return String(message?.itineraryId ?? "") === itineraryId || String(message?.metadata?.itineraryId ?? "") === itineraryId;
  }

  // While the agent is actively streaming, render an in-progress rich itinerary bubble so the user
  // sees days and items light up card-by-card instead of waiting for run completion. Suppress it once
  // a completed assistant message already shows the same itinerary (post-completion takeover) to
  // avoid a double-render flicker.
  const itineraryHasContent = useMemo(() => {
    if (!itinerary?.id) return false;
    const days = Array.isArray(itinerary.days) ? itinerary.days : [];
    const hasItems = days.some((day) => Array.isArray(day?.items) && day.items.length > 0);
    const hasTitle = typeof itinerary.title === "string" && itinerary.title.trim().length > 0;
    return hasItems || hasTitle || days.length > 0;
  }, [itinerary]);

  const isItineraryAlreadyShownByCompletedMessage = useMemo(() => {
    if (!itineraryId) return false;
    return displayedMessages.some((message) => shouldRenderMessageAsItinerary(message));
    // shouldRenderMessageAsItinerary is stable for this dependency window; itineraryId already triggers re-eval.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displayedMessages, itineraryId]);

  const showInProgressItineraryBubble =
    isStreaming && !!itinerary?.id && itineraryHasContent && !isItineraryAlreadyShownByCompletedMessage;



  const prevMessageCountRef = useRef(messages?.length ?? 0);

  useEffect(() => {
    const currentCount = messages?.length ?? 0;
    const isNewMessage = currentCount > prevMessageCountRef.current;
    prevMessageCountRef.current = currentCount;

    const shouldScroll = isNewMessage || (isStreaming && assistantMessage);

    if (shouldScroll && messagesEndRef.current && typeof messagesEndRef.current.scrollIntoView === "function") {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages?.length, isStreaming, assistantMessage, activeToolCalls]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "24px";
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(scrollHeight, 200)}px`;
    }
  }, [composerInput]);

  function handleKeyDown(event) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      if (composerInput.trim() && !isSending) {
        submitComposer(event);
      }
    }
  }

  function submitComposer(event) {
    event.preventDefault();
    if (!composerInput.trim()) return;
    void dispatchAgentMessage(composerInput);
    setComposerInput("");
  }

  return (
    <div className="bg-surface rounded-md border border-border p-4 flex flex-col min-h-0 h-full shadow-soft backdrop-blur-[8px]">

      {/* chat log */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col gap-5 pr-2 mb-5">
        {displayedMessages.length === 0 ? (
          <div className="grid gap-2.5 place-items-center min-h-[220px] text-center text-text-muted">
            <div className="w-12 h-12 rounded-[16px] bg-background flex items-center justify-center text-text-soft mb-2" aria-hidden="true">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <strong>No conversation yet</strong>
            <p>Ask the agent to create the first draft, tighten the route, or prepare a client-ready revision.</p>
          </div>
        ) : (
          displayedMessages.map((message) => (
            <ChatMessage
              key={message.id}
              message={message}
              isUser={message.role === "user"}
              userName={userName}
              userInitials={userInitials}
              itinerary={itinerary}
              renderAsItinerary={shouldRenderMessageAsItinerary(message)}
              placeEntities={placeEntities}
              selectedPlaceId={selectedPlaceId}
              onPlaceSelect={onPlaceSelect}
            />
          ))
        )}

        {isStreaming && (
          <div className="flex gap-3 max-w-full">
            {/* assistant avatar */}
            <div className="w-8 h-8 rounded-[10px] flex items-center justify-center flex-shrink-0 text-[11px] font-extrabold mt-1 bg-primary text-white" aria-hidden="true">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="m16 10-4 4-4-4" />
              </svg>
            </div>
            <div className="flex flex-col gap-1.5 max-w-[85%]">
              {/* thinking bubble */}
              <div className="px-4 py-3 rounded-md text-sm leading-relaxed relative bg-surface border border-dashed border-border flex flex-col gap-2.5 w-full">
                <div className="flex items-center gap-2 text-xs font-bold text-text-primary">
                  <span className="w-1.5 h-1.5 bg-secondary rounded-full animate-pulse flex-shrink-0" />
                  Agent working
                </div>
                {activeToolLabel && (
                  <div className="flex items-center gap-2 px-3 py-2 bg-primary rounded-[10px] text-white" role="status" aria-live="polite">
                    <span className="text-[9px] font-black px-1 py-0.5 bg-white/20 rounded">SYS</span>
                    <span className="text-xs font-semibold">{activeToolLabel}</span>
                  </div>
                )}
                {activeToolCalls.length > 0 && (
                  <div className="flex flex-col gap-2">
                    {activeToolCalls.map((name, idx) => (
                      <div key={name} className="flex items-center gap-2.5 text-xs">
                        <div className="w-[18px] h-[18px] rounded-[6px] bg-border flex items-center justify-center text-[10px] font-extrabold text-text-primary">{idx + 1}</div>
                        <div className="text-text-primary"><strong>{name}</strong></div>
                        {idx < activeToolCalls.length - 1 && <div className="text-text-soft font-extrabold">{"->"}</div>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {showInProgressItineraryBubble && (
          <div className="flex gap-3 max-w-full">
            {/* assistant avatar */}
            <div className="w-8 h-8 rounded-[10px] flex items-center justify-center flex-shrink-0 text-[11px] font-extrabold mt-1 bg-primary text-white" aria-hidden="true">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="m16 10-4 4-4-4" />
              </svg>
            </div>
            <div className="flex flex-col gap-1.5 max-w-[85%]">
              <div className="flex items-center gap-2 text-[11px] font-bold text-text-soft px-1">
                <span className="sender">Voyage Agent</span>
                <span className="time">Agent</span>
              </div>
              <div className="px-4 py-3 rounded-md text-sm leading-relaxed relative bg-background border border-border rounded-bl-[4px]">
                <div className="grid gap-3.5">
                  <RichItineraryMessage
                    itinerary={itinerary}
                    placeEntities={placeEntities}
                    selectedPlaceId={selectedPlaceId}
                    onPlaceSelect={onPlaceSelect}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {hasStreamingBubble && (
          <ChatMessage
            message={{ id: "streaming", role: "assistant", content: assistantMessage }}
            isUser={false}
            userName={userName}
            userInitials={userInitials}
            itinerary={itinerary}
            renderAsItinerary={false}
            placeEntities={placeEntities}
            selectedPlaceId={selectedPlaceId}
            onPlaceSelect={onPlaceSelect}
          />
        )}
        <div ref={messagesEndRef} />
      </div>

      <ChatInput
        textareaRef={textareaRef}
        composerInput={composerInput}
        setComposerInput={setComposerInput}
        handleKeyDown={handleKeyDown}
        submitComposer={submitComposer}
        isSending={isSending}
        agentError={agentError}
      />

    </div>
  );
}
