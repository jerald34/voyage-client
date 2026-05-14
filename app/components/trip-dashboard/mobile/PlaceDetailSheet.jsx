import { getSnapshotPhotoUrl, getReadablePlaceType } from "../../../lib/trip-dashboard/richItinerary.js";
import { getGoogleMapsPlaceUrl } from "../../../lib/trip-dashboard/placeEntities.js";

export default function PlaceDetailSheet({ item, onClose }) {
  if (!item) return null;

  const snapshot = item?.placeSnapshot ?? null;
  const photoUrl = getSnapshotPhotoUrl(snapshot);
  const placeName = snapshot?.name || item?.placeName || item?.title || "Untitled";
  const rating = snapshot?.rating ?? snapshot?.metadata?.rating ?? null;
  const placeType = getReadablePlaceType(snapshot);
  const description = (item?.description || snapshot?.formattedAddress || "").trim();
  const address = snapshot?.formattedAddress || "";
  const highlights = Array.isArray(item?.highlights)
    ? item.highlights
    : Array.isArray(item?.metadata?.highlights)
    ? item.metadata.highlights
    : [];
  const timeLabel =
    item?.startTime && item?.endTime
      ? `${item.startTime} – ${item.endTime}`
      : item?.startTime || "";

  const mapsUrl = getGoogleMapsPlaceUrl(snapshot || item);

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center max-[900px]:block min-[901px]:hidden">
      {/* Backdrop */}
      <button
        type="button"
        className="absolute inset-0 bg-black/30 backdrop-blur-[2px] border-none cursor-default"
        onClick={onClose}
        aria-label="Close details"
      />

      {/* Sheet */}
      <div
        className="relative z-10 w-full max-h-[70vh] overflow-y-auto rounded-t-[24px] glass-panel border-t border-border/10 shadow-strong p-5 flex flex-col gap-4"
        style={{ animation: "pds-slide-up 250ms ease-out" }}
      >
        {/* Handle */}
        <div className="flex justify-center mb-1">
          <div className="w-10 h-1 rounded-full bg-border/30" />
        </div>

        {/* Header */}
        <div className="flex items-start gap-4">
          {photoUrl ? (
            <img
              src={photoUrl}
              alt={placeName}
              className="w-20 h-20 rounded-xl object-cover flex-shrink-0 shadow-md"
            />
          ) : (
            <div className="w-20 h-20 rounded-xl flex-shrink-0 flex items-center justify-center bg-background text-text-soft text-2xl font-serif font-bold border border-border/10">
              {placeName.slice(0, 1).toUpperCase()}
            </div>
          )}
          <div className="flex flex-col gap-1 flex-1 min-w-0">
            <h3 className="m-0 text-[1.1rem] font-serif font-bold text-text-primary leading-tight">
              {placeName}
            </h3>
            {(rating || placeType) && (
              <span className="text-[0.8rem] text-text-soft">
                {rating && <span>★ {rating}</span>}
                {rating && placeType && <span> · </span>}
                {placeType && <span>{placeType}</span>}
              </span>
            )}
            {timeLabel && (
              <span className="text-[0.8rem] text-secondary font-bold">{timeLabel}</span>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full border-none bg-border/10 text-text-soft flex items-center justify-center cursor-pointer hover:bg-border/20 transition-colors flex-shrink-0"
            aria-label="Close"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Address */}
        {address && (
          <p className="m-0 text-[0.85rem] text-text-soft leading-relaxed">{address}</p>
        )}

        {/* Description */}
        {description && description !== address && (
          <p className="m-0 text-[0.9rem] text-text-primary leading-relaxed">{description}</p>
        )}

        {/* Highlights */}
        {highlights.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {highlights.map((h, i) => (
              <span
                key={i}
                className="px-2.5 py-1 rounded-lg bg-background/50 border border-border/10 text-text-soft text-[0.75rem] font-bold"
              >
                {h}
              </span>
            ))}
          </div>
        )}

        {/* Google Maps link */}
        {mapsUrl && (
          <a
            href={mapsUrl}
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex justify-center mt-1 rounded-full bg-secondary text-white py-3 px-5 text-[0.85rem] font-extrabold no-underline hover:opacity-90 transition-opacity"
          >
            Open in Google Maps
          </a>
        )}
      </div>

      <style>{`
        @keyframes pds-slide-up {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
