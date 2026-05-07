import { getLocationMedia } from "../../lib/trip-dashboard/locationMedia.js";

export default function LocationChecklistRow({ dayId, location, onToggleLocation }) {
  const isComplete = Boolean(location?.completed);
  const locationName = location?.name || "location";
  const actionLabel = isComplete ? `Mark ${locationName} not done` : `Mark ${locationName} done`;
  const media = getLocationMedia(location?.name, location?.district);

  return (
    <div
      className={`trip-location-row${isComplete ? " is-complete" : ""}${media ? " has-media" : ""}`}
      style={{ opacity: isComplete ? 0.82 : 1 }}
    >
      <span
        aria-hidden="true"
        style={{
          width: "12px",
          height: "12px",
          borderRadius: "999px",
          background: isComplete ? "var(--voyage-secondary)" : "#fff",
          border: isComplete ? "none" : "2px solid rgba(160, 109, 72, 0.4)",
          position: "relative",
          zIndex: 2,
        }}
      />
      <div style={{ minWidth: 0 }}>
        <strong style={{ display: "block", fontSize: "0.98rem" }}>{locationName}</strong>
        {(location?.district || location?.time) && (
          <span className="trip-location-meta" style={{ color: "var(--voyage-text-muted)", fontSize: "0.86rem" }}>
            {[location?.district, location?.time].filter(Boolean).join(" | ")}
          </span>
        )}
      </div>

      {media && (
        <div className="trip-location-media" title={media.attribution}>
          <img src={media.imageUrl} alt={media.alt || `${locationName} reference`} loading="lazy" />
        </div>
      )}

      <button
        className="button button-secondary"
        type="button"
        aria-pressed={isComplete}
        aria-label={actionLabel}
        style={{ padding: "8px 12px", fontSize: "0.82rem", minWidth: "88px" }}
        onClick={() => onToggleLocation(dayId, location.id)}
      >
        {actionLabel}
      </button>
    </div>
  );
}

