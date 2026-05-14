import { getSnapshotPhotoUrl, getReadablePlaceType } from "../../../lib/trip-dashboard/richItinerary.js";

export default function CompactPlaceCard({
  item,
  isSelected = false,
  onSelect,
}) {
  const snapshot = item?.placeSnapshot ?? null;
  const photoUrl = getSnapshotPhotoUrl(snapshot);
  const placeName = snapshot?.name || item?.placeName || item?.title || "Untitled";
  const rating = snapshot?.rating ?? snapshot?.metadata?.rating ?? null;
  const placeType = getReadablePlaceType(snapshot);
  const timeLabel =
    item?.startTime && item?.endTime
      ? `${item.startTime} – ${item.endTime}`
      : item?.startTime || "";

  return (
    <button
      type="button"
      onClick={() => onSelect?.(item)}
      className={`flex items-center gap-3 w-full text-left px-3 py-2.5 rounded-2xl border transition-all duration-200 glass-panel ${
        isSelected
          ? "ring-2 ring-secondary/40 border-secondary/30 bg-secondary/5"
          : "border-border/10 hover:border-secondary/20 hover:shadow-soft"
      }`}
    >
      {/* Thumbnail */}
      {photoUrl ? (
        <img
          src={photoUrl}
          alt={placeName}
          className="w-14 h-14 rounded-xl object-cover flex-shrink-0 shadow-sm"
        />
      ) : (
        <div className="w-14 h-14 rounded-xl flex-shrink-0 flex items-center justify-center bg-background text-text-soft text-lg font-serif font-bold border border-border/10">
          {placeName.slice(0, 1).toUpperCase()}
        </div>
      )}

      {/* Info */}
      <div className="flex flex-col gap-0.5 min-w-0 flex-1">
        <span className="text-[0.875rem] font-semibold text-text-primary leading-tight line-clamp-2">
          {placeName}
        </span>
        {(rating || placeType) && (
          <span className="text-[0.75rem] text-text-soft leading-tight">
            {rating && <span>★ {rating}</span>}
            {rating && placeType && <span> · </span>}
            {placeType && <span>{placeType}</span>}
          </span>
        )}
        {timeLabel && (
          <span className="text-[0.75rem] text-secondary font-semibold leading-tight">
            {timeLabel}
          </span>
        )}
      </div>
    </button>
  );
}
