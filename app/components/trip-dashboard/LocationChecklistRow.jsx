export default function LocationChecklistRow({ dayId, location, onToggleLocation }) {
  const isComplete = Boolean(location?.completed);

  return (
    <div
      className="activity-chip"
      style={{
        display: "grid",
        gridTemplateColumns: "auto minmax(0, 1fr) auto",
        gap: "14px",
        alignItems: "center",
        padding: "14px 16px",
        opacity: isComplete ? 0.72 : 1,
      }}
    >
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
        <strong style={{ display: "block", fontSize: "0.98rem" }}>{location?.name || "Untitled location"}</strong>
        {(location?.district || location?.time) && (
          <span style={{ color: "var(--voyage-text-muted)", fontSize: "0.86rem" }}>
            {[location?.district, location?.time].filter(Boolean).join(" • ")}
          </span>
        )}
      </div>
      <button
        className="button button-secondary"
        type="button"
        aria-pressed={isComplete}
        aria-label={`Toggle ${location?.name || "location"}`}
        style={{ padding: "8px 12px", fontSize: "0.82rem", minWidth: "88px" }}
        onClick={() => onToggleLocation(dayId, location.id)}
      >
        {isComplete ? "Done" : "Mark done"}
      </button>
    </div>
  );
}
