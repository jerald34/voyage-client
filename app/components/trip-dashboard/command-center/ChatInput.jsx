import React, { useEffect } from "react";

export default function ChatInput({
  textareaRef,
  composerInput,
  setComposerInput,
  handleKeyDown,
  submitComposer,
  isSending,
  agentError,
  onStop,
  containerClassName = "",
}) {
  useEffect(() => {
    const textarea = textareaRef?.current;
    if (!textarea) return;

    textarea.style.height = "auto";
    const nextHeight = Math.min(textarea.scrollHeight, 200);
    textarea.style.height = `${Math.max(nextHeight, 44)}px`;
  }, [composerInput, textareaRef]);

  return (
    <div className={`mt-auto pt-3 w-full ${containerClassName}`}>
      <form
        className="flex w-full min-w-0 items-end gap-2 px-3 py-2.5 rounded-xl bg-surface-elevated border border-border/20 focus-within:border-secondary/50 focus-within:ring-2 focus-within:ring-secondary/15 transition-colors"
        onSubmit={submitComposer}
      >
        <button
          type="button"
          className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-md text-text-soft hover:text-text-primary hover:bg-border/10 transition-colors cursor-pointer self-end mb-0.5"
          aria-label="Attach file"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
          className="flex-1 min-w-0 bg-transparent border-0 outline-none resize-none overflow-y-auto overflow-x-hidden text-sm leading-6 text-text-primary placeholder:text-text-soft px-1 py-1 max-h-[200px] min-h-[48px]"
        />
        {isSending && onStop ? (
          <button
            type="button"
            onClick={onStop}
            className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-md bg-red-500/15 text-red-400 hover:bg-red-500/25 hover:scale-105 active:scale-95 transition-all cursor-pointer border-0 self-end mb-0.5"
            aria-label="Stop generation"
            title="Stop generation"
          >
            <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
              <rect x="4" y="4" width="16" height="16" rx="2" />
            </svg>
          </button>
        ) : (
          <button
            type="submit"
            disabled={isSending || !composerInput.trim()}
            className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-md bg-secondary text-white hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity cursor-pointer self-end mb-0.5"
            aria-label="Send message"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        )}
      </form>
      {agentError && <p className="mt-2 text-xs text-status-danger">{agentError}</p>}
    </div>
  );
}
