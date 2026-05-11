import { getLocationMedia } from "../../lib/trip-dashboard/locationMedia.js";

export default function LocationChecklistRow({ dayId, location, onToggleLocation }) {
  const isComplete = Boolean(location?.completed);
  const locationName = location?.name || "location";
  const actionLabel = isComplete ? `Mark ${locationName} not done` : `Mark ${locationName} done`;
  const media = getLocationMedia(location?.name, location?.district);

  return (
    <div
      className={`relative z-[1] grid ${media ? "grid-cols-[auto_minmax(0,1fr)_76px_auto]" : "grid-cols-[auto_minmax(0,1fr)_auto]"} gap-4 items-center p-4 rounded-md bg-white/[0.76] border border-border/[0.08] max-[768px]:grid-cols-[auto_minmax(0,1fr)] ${isComplete ? "bg-[rgba(238,245,248,0.88)]" : ""}`}
      style={{ opacity: isComplete ? 0.82 : 1 }}
    >
      <span
        aria-hidden="true"
        className={`w-3 h-3 rounded-full relative z-[2] ${isComplete ? "bg-secondary border-none" : "bg-white border-2 border-[rgba(160,109,72,0.4)]"}`}
      />
      <div className="min-w-0">
        <strong className="block text-[0.98rem]">{locationName}</strong>
        {(location?.district || location?.time) && (
          <span className="block mt-1 text-text-muted text-[0.86rem]">
            {[location?.district, location?.time].filter(Boolean).join(" | ")}
          </span>
        )}
      </div>

      {media && (
        <div className="w-[76px] h-16 rounded-sm overflow-hidden border border-border/12 shadow-soft" title={media.attribution}>
          <img className="w-full h-full object-cover" src={media.imageUrl} alt={media.alt || `${locationName} reference`} loading="lazy" />
        </div>
      )}

      <button
        className="inline-flex items-center justify-center gap-2 py-2 px-3 rounded-pill text-[0.82rem] font-extrabold cursor-pointer bg-white/75 text-text-primary border border-border/[0.18] hover:bg-accent/[0.08] hover:border-accent/[0.32] hover:-translate-y-px transition-all min-w-[88px] max-[768px]:col-span-full"
        type="button"
        aria-pressed={isComplete}
        aria-label={actionLabel}
        onClick={() => onToggleLocation(dayId, location.id)}
      >
        {actionLabel}
      </button>
    </div>
  );
}
