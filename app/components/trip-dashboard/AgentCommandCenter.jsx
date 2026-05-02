import { useState, useMemo, useRef, useEffect } from "react";

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
  user
}) {
  const [expandedMessageIds, setExpandedMessageIds] = useState({});
  const messageClampLength = 200;
  const messagesEndRef = useRef(null);

  const displayedMessages = useMemo(() => {
    if (!messages || messages.length === 0) {
      return [
        {
          id: "welcome",
          role: "assistant",
          content: "Absolutely, I'll craft a refined journey with scenic rail, curated experiences, and boutique stays.",
        },
      ];
    }
    return messages.slice(-10);
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
          <div className="agent-avatar-large">
             <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12h4l3-9 5 18 3-9h5"/></svg>
          </div>
          <div>
            <h2>Agent Command Center</h2>
            <p>Your AI planning partner for exceptional journeys</p>
          </div>
        </div>
        <div className="agent-status-tag">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          AI Planner Agent
          <span className="status-dot"></span>
        </div>
      </header>

      <div className="chat-log">
        {displayedMessages.map((message) => {
          const contentState = getMessageContent(message);
          const isUser = message.role === "user";
          return (
            <div key={message.id} className={`chat-row ${isUser ? "user" : "assistant"}`}>
              {!isUser && (
                <div className="avatar assistant-avatar">
                   <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="m16 10-4 4-4-4"/></svg>
                </div>
              )}
              <div className="message-content">
                <div className="message-meta">
                  <span className="sender">{isUser ? (user?.displayName || "Alexandra") : "Voyage Planner"}</span>
                  <span className="time">10:21 AM</span>
                </div>
                <div className={`bubble ${isUser ? "user-bubble" : "assistant-bubble"}`}>
                  <p>{contentState.preview}</p>
                  {contentState.isLong && (
                    <button className="expand-toggle" onClick={() => toggleMessageExpansion(message.id)}>
                      {contentState.isExpanded ? "Show less" : "Show more"}
                    </button>
                  )}
                </div>
              </div>
              {isUser && (
                <div className="avatar user-avatar">
                  <img src="https://i.pravatar.cc/150?img=47" alt="User" />
                </div>
              )}
            </div>
          );
        })}

        {(isStreaming || activeToolCalls.length > 0) && (
          <div className="chat-row assistant">
            <div className="avatar assistant-avatar">
               <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="m16 10-4 4-4-4"/></svg>
            </div>
            <div className="message-content">
               <div className="bubble thinking-bubble">
                 <div className="thinking-header">
                    <span className="dot-pulse">...</span> Agent thinking
                 </div>
                 {activeToolCalls.length > 0 && (
                   <div className="tool-stepper">
                     {activeToolCalls.map((name, idx) => (
                       <div key={name} className="step">
                         <div className="step-icon">✓</div>
                         <div className="step-text">
                           <strong>{name}</strong>
                         </div>
                         {idx < activeToolCalls.length - 1 && <div className="step-connector">→</div>}
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
             <div className="avatar assistant-avatar">
               <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="m16 10-4 4-4-4"/></svg>
            </div>
            <div className="message-content">
              <div className="bubble assistant-bubble streaming">{assistantMessage}</div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-area">
        <form className="composer-form" onSubmit={submitComposer}>
          <button type="button" className="attach-button">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/></svg>
          </button>
          <input
            type="text"
            value={composerInput}
            onChange={(e) => setComposerInput(e.target.value)}
            placeholder="Ask the agent anything..."
          />
          <button type="submit" className="send-button" disabled={isSending || !composerInput.trim()}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
          </button>
        </form>
        {agentError && <p className="error-text">{agentError}</p>}
      </div>

      <div className="quick-actions">
        <button type="button" onClick={() => handleQuickAction("Add scenic train upgrade")}>Add scenic train upgrade</button>
        <button type="button" onClick={() => handleQuickAction("Include spa experience")}>Include spa experience</button>
        <button type="button" onClick={() => handleQuickAction("Adjust to slower pace")}>Adjust to slower pace</button>
        <button type="button" onClick={() => handleQuickAction("Add day in Lucerne")}>Add day in Lucerne</button>
      </div>

      <div className="bottom-actions">
        <div className="action-group">
          <button type="button" className="btn-outline" onClick={() => handleQuickAction("Regenerate the current itinerary with stronger pacing.")}>
             <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12a9 9 0 109-9 9.75 9.75 0 00-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
             Regenerate Plan
          </button>
          <button type="button" className="btn-outline" onClick={() => handleQuickAction("Optimize the route order by travel time.")}>
             <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
             Optimize Route
          </button>
        </div>
        <button type="button" className="btn-solid dark">
           <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
           Save Draft
        </button>
      </div>

      <style jsx>{`
        .agent-command-center {
          background: #ffffff;
          border-radius: 16px;
          border: 1px solid #E5E7EB;
          padding: 24px;
          display: flex;
          flex-direction: column;
          height: 100%;
          min-height: 800px;
          font-family: 'Inter', sans-serif;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.02);
        }

        .chat-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 32px;
        }

        .header-title {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .agent-avatar-large {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: #113437;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .header-title h2 {
          font-size: 18px;
          font-weight: 600;
          color: #111827;
          margin: 0 0 4px 0;
        }

        .header-title p {
          font-size: 13px;
          color: #6B7280;
          margin: 0;
        }

        .agent-status-tag {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #FFF8E1;
          color: #92400E;
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 13px;
          font-weight: 600;
        }

        .status-dot {
          width: 8px;
          height: 8px;
          background: #10B981;
          border-radius: 50%;
        }

        .chat-log {
          flex: 1;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 24px;
          padding-right: 8px;
          margin-bottom: 24px;
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
          width: 32px;
          height: 32px;
          border-radius: 50%;
          overflow: hidden;
          flex-shrink: 0;
        }

        .avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .assistant-avatar {
          background: #113437;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .message-content {
          max-width: 75%;
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
          font-weight: 600;
          color: #374151;
        }

        .time {
          color: #9CA3AF;
        }

        .bubble {
          padding: 16px;
          font-size: 14px;
          line-height: 1.5;
        }

        .user-bubble {
          background: #F8F5F2;
          border-radius: 16px 4px 16px 16px;
          color: #1F2937;
        }

        .assistant-bubble {
          background: white;
          border: 1px solid #E5E7EB;
          border-radius: 4px 16px 16px 16px;
          color: #1F2937;
        }

        .thinking-bubble {
          background: white;
          border: 1px solid #E5E7EB;
          border-radius: 4px 16px 16px 16px;
          padding: 16px;
          min-width: 300px;
        }

        .thinking-header {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 600;
          color: #6B7280;
          font-size: 13px;
          margin-bottom: 12px;
        }

        .dot-pulse {
          letter-spacing: 2px;
        }

        .tool-stepper {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #F9FAFB;
          padding: 12px;
          border-radius: 8px;
          border: 1px solid #F3F4F6;
        }

        .step {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .step-icon {
          width: 16px;
          height: 16px;
          background: #10B981;
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
        }

        .step-text {
          font-size: 12px;
          color: #374151;
        }

        .step-connector {
          color: #9CA3AF;
          font-size: 12px;
        }

        .bubble p {
          margin: 0;
        }

        .expand-toggle {
          background: none;
          border: none;
          color: #2563EB;
          font-size: 12px;
          cursor: pointer;
          padding: 0;
          margin-top: 8px;
        }

        .chat-input-area {
          margin-bottom: 16px;
        }

        .composer-form {
          display: flex;
          align-items: center;
          gap: 12px;
          background: white;
          border: 1px solid #E5E7EB;
          border-radius: 24px;
          padding: 8px 16px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.02);
        }

        .composer-form input {
          flex: 1;
          border: none;
          outline: none;
          font-size: 14px;
          color: #1F2937;
          background: transparent;
        }

        .composer-form input::placeholder {
          color: #9CA3AF;
        }

        .attach-button, .send-button {
          background: none;
          border: none;
          cursor: pointer;
          color: #9CA3AF;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 4px;
        }

        .send-button {
          background: #113437;
          color: white;
          border-radius: 50%;
          width: 32px;
          height: 32px;
        }

        .send-button:disabled {
          background: #E5E7EB;
          cursor: not-allowed;
        }

        .quick-actions {
          display: flex;
          gap: 8px;
          overflow-x: auto;
          padding-bottom: 8px;
          margin-bottom: 24px;
        }

        .quick-actions button {
          white-space: nowrap;
          padding: 8px 16px;
          border-radius: 20px;
          border: 1px solid #E5E7EB;
          background: white;
          color: #4B5563;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .quick-actions button:hover {
          background: #F9FAFB;
          border-color: #D1D5DB;
        }

        .bottom-actions {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 16px;
          border-top: 1px solid #F3F4F6;
        }

        .action-group {
          display: flex;
          gap: 12px;
        }

        .btn-outline, .btn-solid {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 16px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
        }

        .btn-outline {
          background: white;
          border: 1px solid #E5E7EB;
          color: #374151;
        }

        .btn-solid.dark {
          background: #113437;
          color: white;
          border: none;
        }
      `}</style>
    </div>
  );
}
