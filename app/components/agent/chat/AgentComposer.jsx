"use client";
import { useState, useRef } from 'react';

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

  const isDisabled = !input.trim() || isLoading;

  return (
    <div className="px-6 pb-6 pt-4 bg-surface border-t border-border/20">
      <form
        onSubmit={handleSubmit}
        className="flex items-end gap-3 px-3 py-2 bg-background border border-border/20 rounded-[18px] transition-colors focus-within:border-secondary/60"
      >
        <textarea
          ref={textareaRef}
          value={input}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder="Message Voyage Agent..."
          rows={1}
          disabled={isLoading}
          className="flex-grow bg-transparent border-none p-2 text-text-primary font-sans text-sm resize-none max-h-[200px] outline-none leading-[1.5] placeholder:text-text-soft"
        />
        <button
          type="submit"
          disabled={isDisabled}
          className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 mb-0.5 transition-all border-none
            ${isDisabled
              ? 'bg-text-soft/50 cursor-not-allowed opacity-50'
              : 'bg-secondary text-white cursor-pointer hover:scale-105 hover:bg-[#c16e57]'
            }`}
        >
          {isLoading ? (
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          )}
        </button>
      </form>
    </div>
  );
}
