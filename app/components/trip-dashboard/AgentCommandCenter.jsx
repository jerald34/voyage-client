import { useEffect, useMemo, useRef, useState } from "react";

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
  activeMessages = 0,
}) {
  const [expandedMessageIds, setExpandedMessageIds] = useState({});
  const messageClampLength = 220;
  const messagesEndRef = useRef(null);

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
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [displayedMessages, assistantMessage, activeToolCalls]);

  function toggleMessageExpansion(messageId) {
    setExpandedMessageIds((prev) => ({ ...prev, [messageId]: !prev[messageId] }));
  }

  function getMessageContent(message) {
    const rawContent = String(message?.content ?? "").trim();
    const isExpanded = Boolean(expandedMessageIds[message.id]);
    const isLong = rawContent.length > messageClampLength;
    const preview = isLong && !isExpanded ? `${rawContent.slice(0, messageClampLength).trimEnd()}...` : rawContent;
    return { preview, isLong, isExpanded };
  }

  function submitComposer(event) {
    event.preventDefault();
    void dispatchAgentMessage(composerInput);
  }

  function handleQuickAction(action) {
    void dispatchAgentMessage(action);
  }

  return (
    <div className="agent-command-center">
      <header className="chat-header">
        <div className="header-title">
          <div className="agent-avatar-large" aria-hidden="true">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M2 12h4l3-9 5 18 3-9h5" />
            </svg>
          </div>
          <div>
            <h2>Agent Command Center</h2>
            <p>Live planning thread for itinerary updates, approvals, and route changes</p>
          </div>
        </div>
        <div className={`agent-status-tag ${isStreaming ? "streaming" : ""}`}>
          <span className="status-dot" />
          {isStreaming ? "Agent active" : "Agent idle"}
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
            const contentState = getMessageContent(message);
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
                    <p>{contentState.preview}</p>
                    {contentState.isLong && (
                      <button className="expand-toggle" onClick={() => toggleMessageExpansion(message.id)} type="button">
                        {contentState.isExpanded ? "Show less" : "Show more"}
                      </button>
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
              <div className="bubble assistant-bubble streaming">{assistantMessage}</div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="quick-actions" aria-label="Quick agent prompts">
        <button type="button" onClick={() => handleQuickAction("Refine the itinerary pacing.")}>
          Refine pacing
        </button>
        <button type="button" onClick={() => handleQuickAction("Prioritize the highest risk approvals.")}>
          Prioritize approvals
        </button>
        <button type="button" onClick={() => handleQuickAction("Reorder the route by travel time.")}>
          Reorder route
        </button>
        <button type="button" onClick={() => handleQuickAction("Create a client-ready draft summary.")}>
          Draft summary
        </button>
      </div>

      <div className="chat-input-area">
        <form className="composer-form" onSubmit={submitComposer}>
          <button type="button" className="attach-button" aria-label="Attach file">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
            </svg>
          </button>
          <input
            type="text"
            value={composerInput}
            onChange={(e) => setComposerInput(e.target.value)}
            placeholder="Ask the agent to adjust the draft..."
          />
          <button type="submit" className="send-button" disabled={isSending || !composerInput.trim()}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </form>
        {agentError && <p className="error-text">{agentError}</p>}
      </div>

      <style jsx>{`
        .agent-command-center {
          background: #f8f9fb;
          border-radius: 18px;
          border: 1px solid #e6e9ee;
          padding: 24px;
          display: flex;
          flex-direction: column;
          min-height: 0;
          height: 100%;
          box-shadow: none;
          backdrop-filter: none;
        }

        .chat-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 16px;
          margin-bottom: 24px;
        }

        .header-title {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .agent-avatar-large {
          width: 48px;
          height: 48px;
          border-radius: 16px;
          background: #18484d;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 6px 12px rgba(17, 52, 55, 0.16);
          flex-shrink: 0;
        }

        .header-title h2 {
          font-size: 32px;
          font-weight: 700;
          color: #102022;
          margin: 0 0 6px 0;
          font-family: "DM Serif Display", serif;
          font-weight: 400;
        }

        .header-title p {
          font-size: 13px;
          color: #6b7280;
          margin: 0;
          line-height: 1.6;
          max-width: 52ch;
        }

        .agent-status-tag {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: #e9eef8;
          color: #2b5ec8;
          padding: 9px 12px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 700;
          white-space: nowrap;
        }

        .agent-status-tag.streaming {
          background: #ecfdf5;
          color: #047857;
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
          border: 1px dashed #d1d5db;
          background: rgba(255, 255, 255, 0.72);
          color: #4b5563;
        }

        .empty-state strong {
          font-size: 15px;
          color: #111827;
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
          background: #f8fafc;
          color: #b65d48;
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
          background: linear-gradient(135deg, #113437, #1f4d53);
          color: white;
        }

        .user-avatar {
          background: linear-gradient(135deg, #d77a61, #b65d48);
          color: white;
        }

        .message-content {
          max-width: 78%;
          display: flex;
          flex-direction: column;
          gap: 6px;
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
          color: #374151;
        }

        .time {
          color: #9ca3af;
        }

        .bubble {
          padding: 16px 16px 14px;
          font-size: 14px;
          line-height: 1.65;
        }

        .user-bubble {
          background: #f2ece8;
          border-radius: 16px;
          color: #1f2937;
        }

        .assistant-bubble {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 16px;
          color: #1f2937;
        }

        .thinking-bubble {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 16px;
          padding: 16px;
          min-width: 300px;
        }

        .thinking-header {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 700;
          color: #6b7280;
          font-size: 13px;
          margin-bottom: 12px;
        }

        .thinking-dot {
          width: 8px;
          height: 8px;
          border-radius: 999px;
          background: #d77a61;
          box-shadow: 0 0 0 6px rgba(215, 122, 97, 0.12);
        }

        .tool-stepper {
          display: flex;
          align-items: center;
          gap: 10px;
          background: #f8fafc;
          padding: 12px;
          border-radius: 14px;
          border: 1px solid #eef2f7;
          flex-wrap: wrap;
        }

        .step {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .step-icon {
          width: 18px;
          height: 18px;
          background: #10b981;
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          font-weight: 700;
          flex-shrink: 0;
        }

        .step-text {
          font-size: 12px;
          color: #374151;
        }

        .step-connector {
          color: #9ca3af;
          font-size: 12px;
        }

        .bubble p {
          margin: 0;
          white-space: pre-wrap;
        }

        .expand-toggle {
          background: none;
          border: none;
          color: #b65d48;
          font-size: 12px;
          cursor: pointer;
          padding: 0;
          margin-top: 8px;
          font-weight: 600;
        }

        .quick-actions {
          display: flex;
          gap: 8px;
          overflow-x: auto;
          padding-bottom: 8px;
          margin-bottom: 18px;
        }

        .quick-actions button {
          white-space: nowrap;
          padding: 9px 14px;
          border-radius: 999px;
          border: 1px solid #e5e7eb;
          background: rgba(255, 255, 255, 0.92);
          color: #374151;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition:
            transform 0.16s ease,
            border-color 0.16s ease,
            background 0.16s ease;
        }

        .quick-actions button:hover {
          background: white;
          border-color: #d1d5db;
          transform: translateY(-1px);
        }

        .chat-input-area {
          margin-top: auto;
        }

        .composer-form {
          display: flex;
          align-items: center;
          gap: 12px;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 24px;
          padding: 10px 14px;
          box-shadow: 0 14px 30px rgba(15, 23, 42, 0.04);
        }

        .composer-form input {
          flex: 1;
          border: none;
          outline: none;
          font-size: 14px;
          color: #1f2937;
          background: transparent;
        }

        .composer-form input::placeholder {
          color: #9ca3af;
        }

        .attach-button,
        .send-button {
          background: none;
          border: none;
          cursor: pointer;
          color: #9ca3af;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 4px;
        }

        .send-button {
          background: linear-gradient(135deg, #113437, #1f4d53);
          color: white;
          border-radius: 50%;
          width: 36px;
          height: 36px;
          box-shadow: 0 14px 24px rgba(17, 52, 55, 0.18);
        }

        .send-button:disabled {
          background: #e5e7eb;
          color: #9ca3af;
          cursor: not-allowed;
          box-shadow: none;
        }

        .error-text {
          margin: 10px 6px 0;
          color: #b91c1c;
          font-size: 12px;
          font-weight: 600;
        }
      `}</style>
    </div>
  );
}
