"use client";
import { useState } from "react";

/**
 * Renders images attached to a sent message.
 * Layout adapts to 1, 2, or 3 images.
 * Clicking an image opens a full-screen lightbox.
 */
export default function MessageImageGrid({ imageUrls = [] }) {
  const [lightboxUrl, setLightboxUrl] = useState(null);

  if (!imageUrls || imageUrls.length === 0) return null;

  const gridClass =
    imageUrls.length === 1
      ? "grid grid-cols-1 max-w-[280px]"
      : imageUrls.length === 2
        ? "grid grid-cols-2 gap-1.5 max-w-[320px]"
        : "grid grid-cols-2 gap-1.5 max-w-[320px]";

  return (
    <>
      <div className={`${gridClass} mt-2`}>
        {imageUrls.map((url, index) => (
          <button
            key={index}
            type="button"
            onClick={() => setLightboxUrl(url)}
            className={`relative overflow-hidden rounded-lg cursor-pointer hover:opacity-90 transition-opacity border-0 p-0 bg-transparent ${
              imageUrls.length === 3 && index === 0 ? "col-span-2" : ""
            }`}
          >
            <img
              src={url}
              alt={`Attached image ${index + 1}`}
              className={`w-full object-cover ${
                imageUrls.length === 1 ? "max-h-[240px] rounded-lg" : "h-[120px]"
              }`}
              loading="lazy"
            />
          </button>
        ))}
      </div>

      {/* Lightbox overlay */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-[9999] bg-black/80 flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setLightboxUrl(null)}
          role="dialog"
          aria-label="Image preview"
        >
          <button
            type="button"
            onClick={() => setLightboxUrl(null)}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/20 text-white flex items-center justify-center hover:bg-white/30 transition-colors cursor-pointer border-0 z-10"
            aria-label="Close preview"
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
          <img
            src={lightboxUrl}
            alt="Full size preview"
            className="max-w-full max-h-full object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
