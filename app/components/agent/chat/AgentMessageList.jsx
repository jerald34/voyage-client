"use client";

import MarkdownContent from './AgentMarkdown';

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
          <div className={`message-bubble ${msg.role === 'assistant' ? 'markdown-bubble' : 'plain-bubble'}`}>
            <div className={`message-content ${msg.role === 'assistant' ? 'markdown-content' : 'plain-content'}`}>
              {msg.role === 'assistant' ? (
                <MarkdownContent content={msg.content} />
              ) : (
                msg.content
              )}
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
          min-width: 0;
        }

        .plain-content {
          white-space: pre-wrap;
        }

        .markdown-content {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .markdown-content :global(.markdown-paragraph) {
          margin: 0;
        }

        .markdown-content :global(.markdown-paragraph:first-child) {
          margin-top: 0;
        }

        .markdown-content :global(.markdown-paragraph:last-child) {
          margin-bottom: 0;
        }

        .markdown-content :global(.markdown-heading) {
          margin: 0;
          line-height: 1.2;
          font-weight: 700;
          letter-spacing: -0.01em;
        }

        .markdown-content :global(.markdown-heading.level-1) {
          font-size: 22px;
        }

        .markdown-content :global(.markdown-heading.level-2) {
          font-size: 18px;
        }

        .markdown-content :global(.markdown-heading.level-3) {
          font-size: 16px;
        }

        .markdown-content :global(.markdown-heading.level-4),
        .markdown-content :global(.markdown-heading.level-5),
        .markdown-content :global(.markdown-heading.level-6) {
          font-size: 14px;
        }

        .markdown-content :global(.markdown-list) {
          margin: 0;
          padding-left: 20px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .markdown-content :global(.markdown-list li) {
          margin: 0;
        }

        .markdown-content :global(.markdown-blockquote) {
          margin: 0;
          padding: 8px 12px;
          border-left: 3px solid var(--voyage-secondary);
          background: rgba(0, 0, 0, 0.03);
          border-radius: 0 10px 10px 0;
          color: var(--voyage-text-soft);
        }

        .markdown-content :global(.markdown-code-block) {
          margin: 0;
          padding: 12px 14px;
          border-radius: 12px;
          background: rgba(24, 27, 31, 0.96);
          color: #f6f7f9;
          overflow-x: auto;
          max-width: 100%;
          white-space: pre-wrap;
          overflow-wrap: anywhere;
          font-size: 12px;
          line-height: 1.5;
        }

        .markdown-content :global(.markdown-code-block code) {
          font-family: ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas, "Liberation Mono", monospace;
        }

        .markdown-content :global(.inline-code) {
          padding: 0.15em 0.35em;
          border-radius: 6px;
          background: rgba(0, 0, 0, 0.06);
          font-family: ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas, "Liberation Mono", monospace;
          font-size: 0.92em;
        }

        .markdown-content :global(.markdown-link) {
          color: var(--voyage-secondary);
          text-decoration: underline;
          text-underline-offset: 2px;
          word-break: break-word;
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
