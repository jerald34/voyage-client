"use client";
import { useState, useRef, useEffect, useCallback } from 'react';
import ImagePreviewStrip from '../../chat/ImagePreviewStrip';

export default function AgentComposer({
  onSend,
  isLoading,
  onStop,
  editMessage,
  attachments = [],
  onAddFiles,
  onRemoveAttachment,
  fileInputRef,
}) {
  const [input, setInput] = useState('');
  const textareaRef = useRef(null);

  useEffect(() => {
    if (editMessage == null) return;
    setInput(editMessage.content ?? '');
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
      textarea.focus();
      textarea.setSelectionRange(textarea.value.length, textarea.value.length);
    }
  }, [editMessage?.version]);

  const handleInput = (e) => {
    setInput(e.target.value);
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  };

  const hasContent = input.trim() || attachments.length > 0;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (hasContent && !isLoading) {
      onSend(input.trim(), attachments.map((a) => a.file));
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

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    if (onAddFiles && e.dataTransfer?.files?.length) {
      onAddFiles(e.dataTransfer.files);
    }
  }, [onAddFiles]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
  }, []);

  const handlePaste = useCallback((e) => {
    if (!onAddFiles) return;
    const items = e.clipboardData?.items;
    if (!items) return;
    const imageFiles = [];
    for (const item of items) {
      if (item.type.startsWith("image/")) {
        const file = item.getAsFile();
        if (file) imageFiles.push(file);
      }
    }
    if (imageFiles.length > 0) {
      onAddFiles(imageFiles);
    }
  }, [onAddFiles]);

  const isDisabled = !hasContent || isLoading;

  return (
    <div className="px-6 pb-6 pt-4 bg-surface border-t border-border/20">
      {/* Image preview strip */}
      {attachments.length > 0 && (
        <div className="mb-2 px-1">
          <ImagePreviewStrip attachments={attachments} onRemove={onRemoveAttachment} />
        </div>
      )}
      <form
        onSubmit={handleSubmit}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        className="flex items-end gap-3 px-3 py-2 bg-background border border-border/20 rounded-[18px] transition-colors focus-within:border-secondary/60"
      >
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          multiple
          className="hidden"
          onChange={(e) => onAddFiles?.(e.target.files)}
        />
        {/* Attachment button */}
        <button
          type="button"
          className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 mb-0.5 transition-all border-none text-text-soft hover:text-text-primary hover:bg-border/10 cursor-pointer"
          aria-label="Attach image"
          onClick={() => fileInputRef?.current?.click()}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
        </button>
        <textarea
          ref={textareaRef}
          value={input}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          placeholder="Message Voyage Agent..."
          rows={1}
          disabled={isLoading}
          className="flex-grow bg-transparent border-none p-2 text-text-primary font-sans text-sm resize-none max-h-[200px] outline-none leading-[1.5] placeholder:text-text-soft disabled:opacity-60"
        />
        {isLoading && onStop ? (
          <button
            type="button"
            onClick={onStop}
            className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 mb-0.5 transition-all border-none bg-red-500/10 text-red-500 cursor-pointer hover:bg-red-500/20 hover:scale-105 active:scale-95"
            title="Stop generation"
            aria-label="Stop generation"
          >
            <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
              <rect x="4" y="4" width="16" height="16" rx="2" />
            </svg>
          </button>
        ) : (
          <button
            type="submit"
            disabled={isDisabled}
            className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 mb-0.5 transition-all border-none
              ${isDisabled
                ? 'bg-text-soft/50 cursor-not-allowed opacity-50'
                : 'bg-secondary text-white cursor-pointer hover:scale-105 hover:bg-[#c16e57] active:scale-95'
              }`}
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        )}
      </form>
    </div>
  );
}
