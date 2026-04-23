export default function LocationChecklistRow({ dayId, location, onToggleLocation }) {
  const isComplete = Boolean(location?.completed);
  const locationName = location?.name || "location";
  const actionLabel = isComplete ? `Mark ${locationName} not done` : `Mark ${locationName} done`;

  return (
    <div className={`trip-location-row${isComplete ? " is-complete" : ""}`} style={{ opacity: isComplete ? 0.82 : 1 }}>
      <span
        aria-hidden="true"
        style={{
          width: "12px",
          height: "12px",
          borderRadius: "999px",
          background: isComplete ? "var(--voyage-secondary)" : "rgba(160, 109, 72, 0.22)",
          border: "1px solid rgba(160, 109, 72, 0.25)",
        }}
      />
      <div style={{ minWidth: 0 }}>
        <strong style={{ display: "block", fontSize: "0.98rem" }}>{locationName}</strong>
        {(location?.district || location?.time) && (
          <span className="trip-location-meta" style={{ color: "var(--voyage-text-muted)", fontSize: "0.86rem" }}>
            {[location?.district, location?.time].filter(Boolean).join(" • ")}
          </span>
        )}
      </div>
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
