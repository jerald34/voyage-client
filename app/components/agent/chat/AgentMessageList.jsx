"use client";

export default function AgentMessageList({ messages = [] }) {
  // If no messages, we'll show an empty state later or just nothing
  if (messages.length === 0) {
    return (
      <div className="message-list-empty">
        <p>No messages yet. Start a conversation with the Voyage Agent.</p>
      </div>
    );
  }

  return (
    <div className="agent-message-list">
      {messages.map((msg, index) => (
        <div key={index} className={`message-wrapper ${msg.role}`}>
          <div className="message-bubble">
            <div className="message-content">
              {msg.content}
            </div>
            <div className="message-meta">
              <span className="message-role">{msg.role === 'assistant' ? 'Voyage Agent' : 'You'}</span>
              <span className="message-time">{msg.time || 'Just now'}</span>
            </div>
          </div>
        </div>
      ))}

      <style jsx>{`
        .agent-message-list {
          display: flex;
          flex-direction: column;
          gap: 24px;
          padding: 24px;
          flex-grow: 1;
          overflow-y: auto;
        }

        .message-wrapper {
          display: flex;
          width: 100%;
        }

        .message-wrapper.user {
          justify-content: flex-end;
        }

        .message-wrapper.assistant {
          justify-content: flex-start;
        }

        .message-bubble {
          max-width: 85%;
          padding: 16px;
          border-radius: var(--voyage-radius-md);
          position: relative;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .user .message-bubble {
          background: var(--voyage-primary);
          color: white;
          border-bottom-right-radius: 4px;
        }

        .assistant .message-bubble {
          background: var(--voyage-background);
          color: var(--voyage-text);
          border: 1px solid var(--voyage-border-strong);
          border-bottom-left-radius: 4px;
        }

        .message-content {
          font-size: 14px;
          line-height: 1.5;
          white-space: pre-wrap;
        }

        .message-meta {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          opacity: 0.7;
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          font-weight: 700;
        }

        .message-list-empty {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100%;
          color: var(--voyage-text-soft);
          font-size: 14px;
          text-align: center;
          padding: 40px;
        }
      `}</style>
    </div>
  );
}
