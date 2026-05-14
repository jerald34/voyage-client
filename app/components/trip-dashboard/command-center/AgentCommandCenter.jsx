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
  streamingItinerary = null,
  placeEntities = [],
  selectedPlaceId = "",
  onPlaceSelect,
  onStop,
  hideChatInput = false,
}) {
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  const displayedMessages = useMemo(() => {
    if (!Array.isArray(messages) || messages.length === 0) {
      return EMPTY_ARRAY;
    }
    return messages.slice(-12);
  }, [messages]);


  const liveStreamingItinerary = streamingItinerary ?? null;
  const hasStreamingBubble =
    isStreaming &&
    (
      (typeof assistantMessage === "string" &&
        assistantMessage.trim().length > 0 &&
        displayedMessages[displayedMessages.length - 1]?.content !== assistantMessage) ||
      Boolean(liveStreamingItinerary?.id)
    );

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

  const prevMessageCountRef = useRef(messages?.length ?? 0);
  const prevItemCountRef = useRef(0);

  // Scroll when messages arrive or text streams in
  useEffect(() => {
    const currentCount = messages?.length ?? 0;
    const isNewMessage = currentCount > prevMessageCountRef.current;
    prevMessageCountRef.current = currentCount;

    const shouldScroll = isNewMessage
      || (isStreaming && assistantMessage)
      || (isStreaming && activeToolLabel != null);

    if (shouldScroll && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages?.length, isStreaming, assistantMessage, activeToolLabel, activeToolCalls]);

  // Scroll when itinerary grows card-by-card
  useEffect(() => {
    if (!streamingItinerary?.days) return;
    const count = streamingItinerary.days.reduce(
      (sum, d) => sum + (Array.isArray(d.items) ? d.items.length : 0),
      0,
    );
    if (count > prevItemCountRef.current) {
      prevItemCountRef.current = count;
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [streamingItinerary]);

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
    <div className={`${hideChatInput ? "" : "glass-panel backdrop-blur-[24px] shadow-strong"} p-4 flex flex-col min-h-0 h-full transition-all duration-500 ease-in-out`}>

      {/* chat log */}
      <div className={`flex-1 overflow-y-auto overflow-x-hidden flex flex-col gap-5 pr-2 ${hideChatInput ? "mb-0" : "mb-5"}`}>
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
              onEdit={message.role === "user" ? (content) => setComposerInput(content) : undefined}
            />
          ))
        )}

        {isStreaming && (activeToolLabel != null || activeToolCalls.length > 0) && (
          <div className="flex gap-3 max-w-full">
            <div className="w-8 h-8 rounded-[10px] flex items-center justify-center flex-shrink-0 text-[11px] font-extrabold mt-1 bg-secondary text-white" aria-hidden="true">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="m16 10-4 4-4-4" />
              </svg>
            </div>
            <div className="flex flex-col gap-1.5 max-w-[85%]">
              <div className="px-4 py-3 rounded-md bg-[rgba(255,255,255,0.05)] backdrop-blur-md border border-white/10 flex flex-col gap-2.5 w-full" role="status" aria-live="polite">
                {/* completed tools trail */}
                {activeToolCalls.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {activeToolCalls.map((name) => (
                      <span key={name} className="inline-flex items-center gap-1 text-[11px] text-text-soft bg-white/5 border border-white/10 rounded-full px-2 py-[2px]">
                        <svg viewBox="0 0 24 24" width="9" height="9" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#4ade80] flex-shrink-0">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        {String(name).replace(/[_.]+/g, ' ').trim()}
                      </span>
                    ))}
                  </div>
                )}
                {/* animated dots + active label */}
                <div className="flex items-center gap-2.5 text-sm text-text-primary">
                  <span className="cc-thinking-dots" aria-hidden="true">
                    <span /><span /><span />
                  </span>
                  <span>{activeToolLabel || 'Thinking...'}</span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.05em] font-bold text-secondary opacity-70">
                  <span className="cc-live-dot w-1.5 h-1.5 rounded-full bg-current" aria-hidden="true" />
                  Live
                </div>
              </div>
            </div>
          </div>
        )}
        <style>{`
          .cc-thinking-dots { display:inline-flex; gap:3px; align-items:center; flex-shrink:0; }
          .cc-thinking-dots span { display:inline-block; width:5px; height:5px; border-radius:50%; background:var(--voyage-secondary); animation:cc-bounce 1.2s ease-in-out infinite; }
          .cc-thinking-dots span:nth-child(1){animation-delay:0s}
          .cc-thinking-dots span:nth-child(2){animation-delay:.15s}
          .cc-thinking-dots span:nth-child(3){animation-delay:.3s}
          .cc-live-dot{animation:cc-live-pulse 1.4s ease-in-out infinite}
          @keyframes cc-bounce{0%,60%,100%{transform:translateY(0);opacity:.4}30%{transform:translateY(-4px);opacity:1}}
          @keyframes cc-live-pulse{0%,100%{transform:scale(.9);opacity:.7}50%{transform:scale(1);opacity:1}}
        `}</style>

        {hasStreamingBubble && (
          <ChatMessage
            message={{
              id: "streaming",
              role: "assistant",
              content: assistantMessage || "Working on that now."
            }}
            isUser={false}
            userName={userName}
            userInitials={userInitials}
            itinerary={liveStreamingItinerary ?? itinerary}
            renderAsItinerary={Boolean(liveStreamingItinerary?.id)}
            placeEntities={placeEntities}
            selectedPlaceId={selectedPlaceId}
            onPlaceSelect={onPlaceSelect}
          />
        )}
        <div ref={messagesEndRef} />
      </div>

      {!hideChatInput && (
        <ChatInput
          textareaRef={textareaRef}
          composerInput={composerInput}
          setComposerInput={setComposerInput}
          handleKeyDown={handleKeyDown}
          submitComposer={submitComposer}
          isSending={isSending || isStreaming}
          agentError={agentError}
          onStop={onStop}
        />
      )}

    </div>
  );
}
