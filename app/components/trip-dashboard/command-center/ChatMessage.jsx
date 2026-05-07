import React from "react";
import ReactMarkdown from "react-markdown";

export default function ChatMessage({ message, isUser, userName, userInitials }) {
  return (
    <div className={`chat-row ${isUser ? "user" : "assistant"}`}>
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
}
