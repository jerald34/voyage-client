import React, { useEffect } from "react";

const composerSurfaceClass =
  "composer-shell isolate flex w-full min-w-0 items-center gap-2.5 rounded-[18px] border border-border bg-[rgba(255,255,255,0.88)] px-3 py-2.5 shadow-[0_10px_24px_rgba(15,23,42,0.04)] transition-all duration-200 focus-within:border-secondary focus-within:shadow-[0_0_0_4px_rgba(215,122,97,0.12)] dark:bg-[rgba(26,29,33,0.88)]";

const composerTextClass =
  "flex-1 min-w-0 bg-transparent border-0 outline-none resize-none overflow-y-auto overflow-x-hidden px-1 py-2 text-[16px] leading-[1.45] font-medium text-text-primary placeholder:text-text-soft";

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
        className={`${composerSurfaceClass} ${isSending ? "composer-shell--loading" : ""}`}
        onSubmit={submitComposer}
      >
        <button
          type="button"
          className="composer-control relative z-[1] flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-md text-text-soft hover:text-text-primary hover:bg-border/10 transition-colors cursor-pointer"
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
          className={`${composerTextClass} max-h-[200px] min-h-[48px] relative z-[1] composer-control`}
        />
        {isSending && onStop ? (
          <button
            type="button"
            onClick={onStop}
            className="composer-control relative z-[1] flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-md bg-red-500/15 text-red-400 hover:bg-red-500/25 hover:scale-105 active:scale-95 transition-all cursor-pointer border-0"
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
            className="composer-control relative z-[1] flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-md bg-secondary text-white hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity cursor-pointer"
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
      <style>{`
        .composer-shell {
          position: relative;
        }

          .composer-shell::before {
            content: "";
            position: absolute;
            inset: 0;
            border-radius: 18px;
            padding: 1.5px;
            background: linear-gradient(
              90deg,
              rgba(215, 122, 97, 0.04) 0%,
              rgba(215, 122, 97, 0.18) 16%,
              rgba(215, 122, 97, 0.95) 35%,
              rgba(255, 255, 255, 0.95) 50%,
              rgba(215, 122, 97, 0.95) 65%,
              rgba(215, 122, 97, 0.18) 84%,
              rgba(215, 122, 97, 0.04) 100%
            );
            background-size: 320% 100%;
            opacity: 0;
            pointer-events: none;
            transition: opacity 160ms ease;
            -webkit-mask:
              linear-gradient(#fff 0 0) content-box,
              linear-gradient(#fff 0 0);
            -webkit-mask-composite: xor;
            mask-composite: exclude;
          }

          .composer-shell::after {
            content: "";
            position: absolute;
            inset: 2px;
            border-radius: 16px;
            pointer-events: none;
            opacity: 0;
            background:
              radial-gradient(circle at 20% 50%, rgba(215, 122, 97, 0.22), transparent 28%),
              radial-gradient(circle at 80% 50%, rgba(255, 255, 255, 0.18), transparent 24%);
            filter: blur(6px);
          }

          .composer-shell--loading {
            box-shadow:
              0 0 0 1px rgba(215, 122, 97, 0.35),
              0 0 0 6px rgba(215, 122, 97, 0.14),
              0 18px 38px rgba(15, 23, 42, 0.08),
              0 0 42px rgba(215, 122, 97, 0.18);
          }

          .composer-shell--loading::before {
            opacity: 1;
            animation: composer-border-sweep 2.6s linear infinite;
          }

          .composer-shell--loading::after {
            opacity: 1;
            animation: composer-glow-drift 3.2s ease-in-out infinite;
          }

          .composer-shell--loading .composer-control {
            animation: composer-lift 3s ease-in-out infinite;
          }

          @keyframes composer-border-sweep {
            0% {
              background-position: 0% 0;
          }
          100% {
            background-position: 240% 0;
          }
        }

          @keyframes composer-lift {
            0%,
            100% {
              transform: translateY(0);
            }
            50% {
              transform: translateY(-2px);
            }
          }

          @keyframes composer-glow-drift {
            0%,
            100% {
              transform: translateX(-4%);
              opacity: 0.55;
            }
            50% {
              transform: translateX(4%);
              opacity: 1;
            }
          }

          @media (prefers-reduced-motion: reduce) {
            .composer-shell--loading::before,
            .composer-shell--loading::after,
            .composer-shell--loading .composer-control {
              animation: none !important;
            }
          }
      `}</style>
    </div>
  );
}
