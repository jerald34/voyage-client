import React from "react";

export default function ChatInput({ 
  textareaRef, 
  composerInput, 
  setComposerInput, 
  handleKeyDown, 
  submitComposer, 
  isSending, 
  agentError 
}) {
  return (
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
  );
}
