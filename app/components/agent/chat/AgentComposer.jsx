"use client";
import { useState, useRef, useEffect } from 'react';

export default function AgentComposer({ onSend, isLoading }) {
  const [input, setInput] = useState('');
  const textareaRef = useRef(null);

  const handleInput = (e) => {
    setInput(e.target.value);
    
    // Auto-expand textarea
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSend(input.trim());
      setInput('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="agent-composer">
      <form onSubmit={handleSubmit} className="composer-form">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder="Message Voyage Agent..."
          rows={1}
          className="composer-textarea"
          disabled={isLoading}
        />
        <button 
          type="submit" 
          className={`send-button ${!input.trim() || isLoading ? 'disabled' : ''}`}
          disabled={!input.trim() || isLoading}
        >
          {isLoading ? (
            <span className="loading-spinner"></span>
          ) : (
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
          )}
        </button>
      </form>

      <style jsx>{`
        .agent-composer {
          padding: 16px 24px 24px;
          background: white;
          border-top: 1px solid var(--voyage-border);
        }

        .composer-form {
          display: flex;
          align-items: flex-end;
          gap: 12px;
          padding: 8px 12px;
          background: var(--voyage-background);
          border: 1px solid var(--voyage-border-strong);
          border-radius: var(--voyage-radius-md);
          transition: border-color 0.2s;
        }

        .composer-form:focus-within {
          border-color: var(--voyage-secondary);
        }

        .composer-textarea {
          flex-grow: 1;
          background: transparent;
          border: none;
          padding: 8px 4px;
          color: var(--voyage-text);
          font-family: inherit;
          font-size: 14px;
          resize: none;
          max-height: 200px;
          outline: none;
          line-height: 1.5;
        }

        .composer-textarea::placeholder {
          color: var(--voyage-text-soft);
        }

        .send-button {
          background: var(--voyage-secondary);
          color: white;
          border: none;
          width: 36px;
          height: 36px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
          flex-shrink: 0;
          margin-bottom: 2px;
        }

        .send-button:hover:not(.disabled) {
          transform: scale(1.05);
          background: #c16e57;
        }

        .send-button.disabled {
          background: var(--voyage-text-soft);
          opacity: 0.5;
          cursor: not-allowed;
        }

        .loading-spinner {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-radius: 50%;
          border-top-color: white;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
