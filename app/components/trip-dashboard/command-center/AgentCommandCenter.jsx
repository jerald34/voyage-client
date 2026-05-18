import { useEffect, useMemo, useRef, useState } from "react";
import ClientSwitcher from "./ClientSwitcher.jsx";
import ChatMessage from "./ChatMessage.jsx";
import ChatInput from "./ChatInput.jsx";
import RichItineraryMessage from "./RichItineraryMessage.jsx";
import useImageAttachments from "../../../hooks/useImageAttachments.js";

function humanizeToolName(name) {
  return String(name ?? "")
    .replace(/[_\.]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

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
  const imageAttachments = useImageAttachments();

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
      const hasContent = composerInput.trim() || imageAttachments.hasAttachments;
      if (hasContent && !isSending) {
        submitComposer(event);
      }
    }
  }

  function submitComposer(event) {
    event.preventDefault();
    const hasContent = composerInput.trim() || imageAttachments.hasAttachments;
    if (!hasContent) return;
    // Pass image URLs (will be [] if no attachments); the parent handles upload
    void dispatchAgentMessage(composerInput, imageAttachments.attachments.map((a) => a.file));
    setComposerInput("");
    imageAttachments.clear();
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
            <div className="w-8 h-8 rounded-[10px] flex items-center justify-center flex-shrink-0 text-[11px] font-extrabold mt-1 bg-secondary text-white shadow-sm" aria-hidden="true">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="m16 10-4 4-4-4" />
              </svg>
            </div>
            <div className="flex flex-col gap-1.5 max-w-[85%] min-w-0">
              <div
                className="cc-tool-status-card w-full rounded-[20px] rounded-bl-[4px] border border-white/10 bg-[rgba(255,255,255,0.06)] px-4 py-3.5 backdrop-blur-md shadow-[0_16px_40px_rgba(15,23,42,0.16)]"
                role="status"
                aria-live="polite"
              >
                <div className="flex flex-wrap gap-1.5">
                  {activeToolCalls.map((name, index) => (
                    <span
                      key={name}
                      className="cc-tool-chip inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-text-soft"
                      style={{ animationDelay: `${index * 90}ms` }}
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-secondary" aria-hidden="true" />
                      {humanizeToolName(name)}
                    </span>
                  ))}
                </div>

                <div className="mt-2.5 flex items-center gap-2.5 text-sm text-text-primary">
                  <span className="cc-thinking-dots" aria-hidden="true">
                    <span />
                    <span />
                    <span />
                  </span>
                  <span className="font-medium">{activeToolLabel || "Thinking..."}</span>
                </div>

                <div className="mt-2.5 flex items-center justify-between gap-2 text-[10px] uppercase tracking-[0.08em] font-bold text-text-soft">
                  <span>{activeToolCalls.length > 0 ? "Tool activity" : "Live status"}</span>
                  <span className="flex items-center gap-1.5 text-secondary/80">
                    <span className="cc-live-dot w-1.5 h-1.5 rounded-full bg-current" aria-hidden="true" />
                    Live
                  </span>
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
          .cc-tool-status-card { animation: cc-card-breathe 3.4s ease-in-out infinite; transform-origin: center; }
          .cc-tool-chip { animation: cc-chip-pop 320ms ease-out both; }
          .cc-live-dot{animation:cc-live-pulse 1.4s ease-in-out infinite}
          @keyframes cc-bounce{0%,60%,100%{transform:translateY(0);opacity:.4}30%{transform:translateY(-4px);opacity:1}}
          @keyframes cc-live-pulse{0%,100%{transform:scale(.9);opacity:.7}50%{transform:scale(1);opacity:1}}
          @keyframes cc-card-breathe{0%,100%{transform:translateY(0);box-shadow:0 16px 40px rgba(15,23,42,.16)}50%{transform:translateY(-1px);box-shadow:0 20px 50px rgba(15,23,42,.20)}}
          @keyframes cc-chip-pop{0%{transform:translateY(4px) scale(.98);opacity:0}100%{transform:translateY(0) scale(1);opacity:1}}
          @media (prefers-reduced-motion: reduce) {
            .cc-tool-status-card,
            .cc-tool-chip,
            .cc-thinking-dots span,
            .cc-live-dot { animation: none !important; }
          }
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
          attachments={imageAttachments.attachments}
          onAddFiles={imageAttachments.addFiles}
          onRemoveAttachment={imageAttachments.removeAttachment}
          fileInputRef={imageAttachments.fileInputRef}
        />
      )}

    </div>
  );
}
