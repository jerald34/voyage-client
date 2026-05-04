import { useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";

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
  activeTrip,
  availableTrips = [],
  onTripChange,
  onNewItinerary,
  activeMessages = 0,
}) {
  const [isClientMenuOpen, setIsClientMenuOpen] = useState(false);
  const messagesEndRef = useRef(null);
  const clientMenuRef = useRef(null);
  const textareaRef = useRef(null);

  const safeTrips = useMemo(() => (Array.isArray(availableTrips) ? availableTrips.filter(Boolean) : []), [availableTrips]);
  const hasTrips = safeTrips.length > 0;
  const selectedTrip = activeTrip ?? safeTrips[0] ?? null;
  const activeTripClientName = String(selectedTrip?.clientName ?? "").trim();
  const activeTripInitials = activeTripClientName ? getInitials(activeTripClientName) : "";
  const activeTripOrganizerInitials = selectedTrip?.assignedOrganizer ? getInitials(selectedTrip.assignedOrganizer) : "";
  const clientMenuEmptyTitle = "No client trips available";
  const clientMenuEmptyBody = "Use New Itinerary to create the first trip.";

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

  useEffect(() => {
    if (messagesEndRef.current && typeof messagesEndRef.current.scrollIntoView === "function") {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [displayedMessages, assistantMessage, activeToolCalls]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "24px"; // Reset to min height
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
    void dispatchAgentMessage(composerInput);
  }


  return (
    <div className="agent-command-center">
      <header className="chat-header">
        <div className="header-main">
          <div className="header-tools">
            <button
              className="new-itinerary-button"
              onClick={() => onNewItinerary?.()}
              type="button"
            >
              <span className="new-itinerary-icon" aria-hidden="true">
                +
              </span>
              New Itinerary
            </button>
            <div className="client-switcher-wrap" ref={clientMenuRef}>
              <span className="client-switcher-label">Current client</span>
              <button
                className={`client-switcher ${isClientMenuOpen ? "open" : ""}`}
                onClick={() => setIsClientMenuOpen((current) => !current)}
                type="button"
                aria-haspopup="listbox"
                aria-expanded={isClientMenuOpen}
                aria-label={hasTrips ? `Current client: ${activeTripClientName}` : clientMenuEmptyTitle}
              >
                {activeTripClientName ? (
                  <>
                    <span className="client-badge-stack" aria-hidden="true">
                      <span className="client-badge primary">{activeTripInitials}</span>
                      {activeTripOrganizerInitials && <span className="client-badge secondary">{activeTripOrganizerInitials}</span>}
                    </span>
                    <span className="client-switcher-name">{activeTripClientName}</span>
                  </>
                ) : (
                  <span className="client-switcher-empty">{clientMenuEmptyTitle}</span>
                )}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </button>

              {isClientMenuOpen && (
                <div className="client-menu" role="listbox" aria-label="Current client">
                  {hasTrips ? (
                    safeTrips.map((trip) => {
                      const isSelected = trip?.id === activeTrip?.id;
                      const initials = getInitials(trip?.clientName || "Client");

                      return (
                        <button
                          key={trip?.id ?? trip?.clientName}
                          type="button"
                          className={`client-option ${isSelected ? "selected" : ""}`}
                          role="option"
                          aria-selected={isSelected}
                          onClick={() => {
                            onTripChange?.(trip?.id ?? null);
                            setIsClientMenuOpen(false);
                          }}
                        >
                          <span className="client-option-badge" aria-hidden="true">
                            {initials}
                          </span>
                          <span className="client-option-body">
                            <strong>{trip?.clientName}</strong>
                            {trip?.destination && <span>{trip.destination}</span>}
                          </span>
                          {isSelected && (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                              <path d="m20 6-11 11-5-5" />
                            </svg>
                          )}
                        </button>
                      );
                    })
                  ) : (
                    <div className="client-menu-empty" role="status" aria-live="polite">
                      <strong>{clientMenuEmptyTitle}</strong>
                      <p>{clientMenuEmptyBody}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          <div className={`agent-status-tag ${isStreaming ? "streaming" : ""}`}>
            <span className="status-dot" />
            {isStreaming ? "Agent active" : "Agent idle"}
          </div>
        </div>
      </header>

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
          displayedMessages.map((message) => {
            const isUser = message.role === "user";

            return (
              <div key={message.id} className={`chat-row ${isUser ? "user" : "assistant"}`}>
                {!isUser && (
                  <div className="avatar assistant-avatar" aria-hidden="true">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <path d="m16 10-4 4-4-4" />
                    </svg>
                  </div>
                )}
                <div className="message-content">
                  <div className="message-meta">
                    <span className="sender">{isUser ? userName : "Voyage Agent"}</span>
                    <span className="time">{isUser ? "You" : "Agent"}</span>
                  </div>
                  <div className={`bubble ${isUser ? "user-bubble" : "assistant-bubble"}`}>
                    {isUser ? (
                      <p>{message.content}</p>
                    ) : (
                      <div className="markdown-content">
                        <ReactMarkdown>{message.content}</ReactMarkdown>
                      </div>
                    )}
                  </div>
                </div>
                {isUser && (
                  <div className="avatar user-avatar" aria-hidden="true">
                    {userInitials}
                  </div>
                )}
              </div>
            );
          })
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
                {activeToolCalls.length > 0 && (
                  <div className="tool-stepper">
                    {activeToolCalls.map((name, idx) => (
                      <div key={name} className="step">
                        <div className="step-icon">{idx + 1}</div>
                        <div className="step-text">
                          <strong>{name}</strong>
                        </div>
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
          <div className="chat-row assistant">
            <div className="avatar assistant-avatar" aria-hidden="true">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="m16 10-4 4-4-4" />
              </svg>
            </div>
            <div className="message-content">
              <div className="bubble assistant-bubble streaming">
                <div className="markdown-content">
                  <ReactMarkdown>{assistantMessage}</ReactMarkdown>
                </div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>


      <div className="chat-input-area">
        <form className="composer-form" onSubmit={submitComposer}>
          <button type="button" className="attach-button" aria-label="Attach file">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="composer-icon">
              <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
            </svg>
          </button>
          <textarea
            ref={textareaRef}
            rows={1}
            value={composerInput}
            onChange={(e) => setComposerInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask the agent to adjust the draft..."
          />
          <button type="submit" className="send-button" disabled={isSending || !composerInput.trim()}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="composer-icon">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </form>
        {agentError && <p className="error-text">{agentError}</p>}
      </div>

      <style jsx>{`
        .agent-command-center {
          background: var(--voyage-surface);
          border-radius: 18px;
          border: 1px solid var(--voyage-border);
          padding: 16px;
          display: flex;
          flex-direction: column;
          min-height: 0;
          height: 100%;
          box-shadow: var(--voyage-shadow-soft);
          backdrop-filter: blur(8px);
        }

        .chat-header {
          margin-bottom: 12px;
        }

        .header-main {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          gap: 16px;
          flex-wrap: wrap;
        }

        .header-tools {
          display: flex;
          align-items: flex-end;
          gap: 12px;
          min-width: 0;
          flex-wrap: wrap;
        }

        .agent-avatar-large {
          width: 48px;
          height: 48px;
          border-radius: 16px;
          background: var(--voyage-primary);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 6px 12px rgba(34, 56, 67, 0.16);
          flex-shrink: 0;
        }

        .header-title h2 {
          font-size: 32px;
          font-weight: 700;
          color: var(--voyage-primary);
          margin: 0 0 6px 0;
          font-family: "DM Serif Display", serif;
          font-weight: 400;
        }

        .header-title p {
          display: none;
        }

        .client-switcher-wrap {
          position: relative;
          display: inline-flex;
          flex-direction: column;
          gap: 6px;
          max-width: 100%;
          min-width: 0;
        }

        .client-switcher-label {
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--voyage-text-soft);
          margin-left: 2px;
        }

        .new-itinerary-button {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          border: 1px solid var(--voyage-primary);
          border-radius: 999px;
          background: var(--voyage-primary);
          color: #f8fafc;
          padding: 10px 18px;
          font-size: 13px;
          font-weight: 700;
          letter-spacing: -0.01em;
          cursor: pointer;
          white-space: nowrap;
          box-shadow: 0 4px 12px rgba(34, 56, 67, 0.12);
          transition: all 0.2s ease;
          height: 44px;
        }

        .new-itinerary-button:hover {
          transform: translateY(-1px);
          opacity: 0.9;
          box-shadow: 0 6px 14px rgba(34, 56, 67, 0.16);
        }

        .new-itinerary-icon {
          width: 18px;
          height: 18px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.1);
          font-size: 14px;
          line-height: 1;
        }

        .client-switcher {
          display: inline-flex;
          align-items: center;
          gap: 12px;
          min-width: 240px;
          max-width: 100%;
          height: 44px;
          border: 1px solid var(--voyage-primary);
          border-radius: 999px;
          background: var(--voyage-primary);
          color: #f8fafc;
          padding: 0 14px 0 10px;
          cursor: pointer;
          text-align: left;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        }

        .client-switcher:hover {
          opacity: 0.95;
        }

        .client-switcher.open {
          background: var(--voyage-primary);
        }

        .client-badge-stack {
          display: flex;
          align-items: center;
          margin-right: 2px;
        }

        .client-badge {
          width: 30px;
          height: 30px;
          border-radius: 999px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: 800;
          flex-shrink: 0;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
        }

        .client-badge.primary {
          background: var(--voyage-secondary);
          color: white;
        }

        .client-badge.secondary {
          margin-left: -8px;
          background: var(--voyage-accent);
          color: white;
          border: 2px solid var(--voyage-primary);
        }

        .client-switcher-name {
          font-size: 15px;
          font-weight: 600;
          letter-spacing: -0.01em;
          flex: 1;
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          color: #f1f5f9;
        }

        .client-switcher-empty {
          flex: 1;
          min-width: 0;
          font-size: 13px;
          font-weight: 600;
          letter-spacing: -0.01em;
          color: #cbd5e1;
        }

        .client-menu {
          position: absolute;
          top: calc(100% + 8px);
          right: 0;
          width: min(460px, 100vw - 48px);
          background: var(--voyage-primary);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 18px;
          box-shadow: 0 18px 36px rgba(34, 56, 67, 0.3);
          padding: 10px;
          z-index: 100;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .client-option {
          display: flex;
          align-items: center;
          gap: 10px;
          width: 100%;
          border: none;
          background: transparent;
          color: #e2e8f0;
          padding: 12px;
          border-radius: 14px;
          cursor: pointer;
          text-align: left;
          transition: all 0.18s ease;
        }

        .client-option:hover,
        .client-option.selected {
          background: rgba(255, 255, 255, 0.1);
          color: white;
        }

        .client-option-badge {
          width: 30px;
          height: 30px;
          border-radius: 999px;
          background: var(--voyage-secondary);
          color: white;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: 800;
          flex-shrink: 0;
        }

        .client-option-body {
          display: flex;
          flex-direction: column;
          gap: 2px;
          min-width: 0;
          flex: 1;
        }

        .client-option-body strong {
          font-size: 15px;
          font-weight: 600;
        }

        .client-option-body span {
          font-size: 12px;
          color: inherit;
          opacity: 0.72;
        }

        .client-menu-empty {
          display: grid;
          gap: 4px;
          padding: 14px;
          border-radius: 14px;
          background: rgba(255, 255, 255, 0.04);
          color: #e2e8f0;
          font-size: 13px;
          line-height: 1.5;
        }

        .client-menu-empty strong {
          color: #f8fafc;
          font-size: 14px;
        }

        .client-menu-empty p {
          margin: 0;
          color: #cbd5e1;
        }

        .agent-status-tag {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: var(--voyage-background);
          border: 1px solid var(--voyage-border);
          color: var(--voyage-text-muted);
          padding: 8px 14px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 700;
          white-space: nowrap;
          height: 34px;
        }

        .agent-status-tag.streaming {
          background: #ecfdf5;
          color: #047857;
          border-color: #bbf7d0;
        }

        .status-dot {
          width: 8px;
          height: 8px;
          background: currentColor;
          border-radius: 999px;
          flex-shrink: 0;
        }

        .chat-log {
          flex: 1;
          overflow-y: auto;
          overflow-x: hidden;
          display: flex;
          flex-direction: column;
          gap: 20px;
          padding-right: 8px;
          margin-bottom: 20px;
        }

        .empty-state {
          display: grid;
          gap: 10px;
          place-items: center;
          min-height: 220px;
          text-align: center;
          padding: 24px;
          border-radius: 20px;
          border: 1px dashed var(--voyage-border-strong);
          background: rgba(255, 255, 255, 0.5);
          color: var(--voyage-text-muted);
        }

        .empty-state strong {
          font-size: 15px;
          color: var(--voyage-primary);
        }

        .empty-state p {
          margin: 0;
          max-width: 44ch;
          line-height: 1.6;
        }

        .empty-icon {
          width: 48px;
          height: 48px;
          border-radius: 16px;
          background: var(--voyage-background);
          color: var(--voyage-secondary);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .chat-row {
          display: flex;
          gap: 12px;
          align-items: flex-start;
        }

        .chat-row.user {
          justify-content: flex-end;
        }

        .avatar {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          overflow: hidden;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: 700;
        }

        .assistant-avatar {
          background: var(--voyage-primary);
          color: white;
        }

        .user-avatar {
          background: var(--voyage-secondary);
          color: white;
        }

        .message-content {
          max-width: 78%;
          display: flex;
          flex-direction: column;
          gap: 6px;
          overflow-wrap: break-word;
          word-wrap: break-word;
          word-break: break-word;
        }

        .chat-row.user .message-content {
          align-items: flex-end;
        }

        .message-meta {
          display: flex;
          gap: 8px;
          align-items: center;
          font-size: 12px;
        }

        .sender {
          font-weight: 700;
          color: var(--voyage-text);
        }

        .time {
          color: var(--voyage-text-soft);
        }

        .bubble {
          padding: 16px 16px 14px;
          font-size: 15px;
          line-height: 1.75;
        }

        .user-bubble {
          background: var(--voyage-background);
          border: 1px solid var(--voyage-border);
          border-radius: 20px 4px 20px 20px;
          color: var(--voyage-text);
        }

        .assistant-bubble {
          background: #ffffff;
          border: 1px solid var(--voyage-border);
          border-left: 4px solid var(--voyage-secondary);
          border-radius: 4px 18px 18px 18px;
          color: var(--voyage-primary);
          box-shadow: var(--voyage-shadow-soft);
          padding: 20px 24px;
          overflow-wrap: break-word;
          word-wrap: break-word;
          word-break: break-word;
        }

        .thinking-bubble {
          background: #ffffff;
          border: 1px solid var(--voyage-border);
          border-left: 4px solid var(--voyage-accent);
          border-radius: 18px;
          padding: 20px;
          min-width: 300px;
          box-shadow: var(--voyage-shadow-soft);
        }

        .thinking-header {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          font-weight: 700;
          color: var(--voyage-primary);
          margin-bottom: 12px;
        }

        .thinking-dot {
          width: 8px;
          height: 8px;
          background: var(--voyage-accent);
          border-radius: 50%;
          animation: pulse 1.5s infinite;
        }

        @keyframes pulse {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.4); opacity: 0.5; }
          100% { transform: scale(1); opacity: 1; }
        }

        .tool-stepper {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .step {
          display: flex;
          align-items: center;
          gap: 12px;
          position: relative;
        }

        .step-icon {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: var(--voyage-background);
          border: 1.5px solid var(--voyage-border-strong);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: 800;
          color: var(--voyage-text-soft);
          flex-shrink: 0;
          z-index: 2;
        }

        .step-text {
          font-size: 13px;
          color: var(--voyage-text);
        }

        .step-connector {
          display: none;
        }

        .markdown-content {
          line-height: 1.7;
          font-size: 15px;
        }

        .markdown-content :global(p) {
          margin: 0 0 16px 0;
        }

        .markdown-content :global(p:last-child) {
          margin-bottom: 0;
        }

        .markdown-content :global(ul), .markdown-content :global(ol) {
          margin: 0 0 16px 0;
          padding-left: 20px;
        }

        .markdown-content :global(li) {
          margin-bottom: 8px;
        }

        .chat-input-area {
          padding-top: 12px;
          border-top: 1px solid var(--voyage-border);
        }

        .composer-form {
          display: flex;
          align-items: flex-end;
          gap: 12px;
          background: var(--voyage-background);
          border: 1px solid var(--voyage-border-strong);
          border-radius: 16px;
          padding: 8px 12px;
          transition: border-color 0.2s;
        }

        .composer-form:focus-within {
          border-color: var(--voyage-secondary);
        }

        .composer-form textarea {
          flex: 1;
          background: transparent;
          border: none;
          resize: none;
          padding: 8px 0;
          font-family: inherit;
          font-size: 14px;
          line-height: 1.5;
          color: var(--voyage-primary);
          outline: none;
          min-height: 24px;
        }

        .attach-button, .send-button {
          background: transparent;
          border: none;
          padding: 8px;
          color: var(--voyage-text-soft);
          cursor: pointer;
          border-radius: 8px;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .attach-button:hover {
          background: rgba(0, 0, 0, 0.05);
          color: var(--voyage-primary);
        }

        .send-button {
          background: var(--voyage-secondary);
          color: white;
        }

        .send-button:hover:not(:disabled) {
          opacity: 0.9;
          transform: translateY(-1px);
        }

        .send-button:disabled {
          background: var(--voyage-border);
          cursor: not-allowed;
        }

        .composer-icon {
          width: 20px;
          height: 20px;
        }

        .error-text {
          margin: 8px 0 0;
          font-size: 12px;
          color: #b91c1c;
          font-weight: 600;
        }
      `}</style>
    </div>
  );
}
