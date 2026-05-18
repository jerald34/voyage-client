"use client";

/**
 * Horizontal strip of image thumbnails shown in the composer before sending.
 * Each thumbnail has a remove button overlay.
 */
export default function ImagePreviewStrip({ attachments = [], onRemove }) {
  if (attachments.length === 0) return null;

  return (
    <div className="flex items-center gap-2 px-1 py-1.5 overflow-x-auto">
      {attachments.map((attachment) => (
        <div
          key={attachment.id}
          className="relative flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden border border-border/30 group"
        >
          <img
            src={attachment.previewUrl}
            alt="Attachment preview"
            className="w-full h-full object-cover"
          />

          {/* Upload status overlay */}
          {attachment.status === "uploading" && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <svg className="w-5 h-5 text-white animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
          )}
          {attachment.status === "error" && (
            <div className="absolute inset-0 bg-red-500/30 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </div>
          )}

          {/* Remove button */}
          <button
            type="button"
            onClick={() => onRemove(attachment.id)}
            className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full bg-black/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer hover:bg-black/90 z-10"
            aria-label="Remove image"
          >
            <svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
}
