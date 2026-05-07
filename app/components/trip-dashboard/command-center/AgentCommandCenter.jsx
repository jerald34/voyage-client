import { useEffect, useMemo, useRef, useState } from "react";
import "./AgentCommandCenter.css";
import ClientSwitcher from "./ClientSwitcher.jsx";
import ChatMessage from "./ChatMessage.jsx";
import ChatInput from "./ChatInput.jsx";

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
      return [];
    }
    return messages.slice(-12);
  }, [messages]);


  const hasStreamingBubble =
    isStreaming &&
    typeof assistantMessage === "string" &&
    assistantMessage.trim().length > 0 &&
    displayedMessages[displayedMessages.length - 1]?.content !== assistantMessage;

  const activeToolCalls = useMemo(() => {
    const recent = Array.isArray(toolCalls) ? [...toolCalls].slice(-4).reverse() : [];
    const uniqueNames = [];

    for (const call of recent) {
      if (!call?.name || uniqueNames.includes(call.name)) continue;
      uniqueNames.push(call.name);
      if (uniqueNames.length >= 3) break;
    }

    return uniqueNames;
  }, [toolCalls]);

  const userName = user?.displayName || "You";
  const userInitials = getInitials(userName);
  const itineraryId = itinerary?.id != null ? String(itinerary.id) : null;

  function shouldRenderMessageAsItinerary(message) {
    if (!itineraryId || message?.role !== "assistant") return false;
    return String(message?.itineraryId ?? "") === itineraryId || String(message?.metadata?.itineraryId ?? "") === itineraryId;
  }



  useEffect(() => {
    if (messagesEndRef.current && typeof messagesEndRef.current.scrollIntoView === "function") {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [displayedMessages, assistantMessage, activeToolCalls]);

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
    <div className="agent-command-center">


      <div className="chat-log">
        {displayedMessages.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon" aria-hidden="true">
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

        {(isStreaming || activeToolCalls.length > 0) && (
          <div className="chat-row assistant">
            <div className="avatar assistant-avatar" aria-hidden="true">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="m16 10-4 4-4-4" />
              </svg>
            </div>
            <div className="message-content">
              <div className="bubble thinking-bubble">
                <div className="thinking-header">
                  <span className="thinking-dot" />
                  Agent working
                </div>
                {activeToolLabel && (
                  <div className="system-banner" role="status" aria-live="polite">
                    <span className="system-banner-label">SYS</span>
                    <span className="system-banner-text">{activeToolLabel}</span>
                  </div>
                )}
                {activeToolCalls.length > 0 && (
                  <div className="tool-stepper">
                    {activeToolCalls.map((name, idx) => (
                      <div key={name} className="step">
                        <div className="step-icon">{idx + 1}</div>
                        <div className="step-text"><strong>{name}</strong></div>
                        {idx < activeToolCalls.length - 1 && <div className="step-connector">{"->"}</div>}
                      </div>
                    ))}
                  </div>
                )}
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
