import LocationChecklistRow from "./LocationChecklistRow.jsx";

export default function ItineraryDayCard({ day, onMarkDayDone, onToggleLocation }) {
  const locations = Array.isArray(day?.locations) ? day.locations : [];
  const progress = day?.progress ?? {
    completedCount: 0,
    totalCount: locations.length,
    percent: 0,
    isComplete: false,
    isEmpty: locations.length === 0,
  };

  return (
    <article
      className={`day-card ${progress.isComplete ? "selected" : ""}`}
      style={{
        display: "grid",
        gap: "18px",
        padding: "22px",
        borderColor: progress.isComplete ? "rgba(160, 109, 72, 0.4)" : undefined,
        background: progress.isComplete ? "rgba(255,255,255,0.82)" : undefined,
      }}
    >
      <div className="day-card-head" style={{ alignItems: "start" }}>
        <div style={{ display: "grid", gap: "8px" }}>
          <span className="frame-label">{day?.label || "Day"}</span>
          <h3 style={{ fontSize: "1.35rem", margin: 0 }}>{day?.title || "Planning in progress"}</h3>
          {day?.note && (
            <p style={{ margin: 0, color: "var(--voyage-text-muted)", fontSize: "0.92rem" }}>{day.note}</p>
          )}
        </div>

        <button
          className="button button-secondary"
          type="button"
          aria-label={`Mark ${String(day?.label || "day").toLowerCase()} done`}
          disabled={progress.isEmpty}
          style={{ padding: "10px 14px", fontSize: "0.85rem" }}
          onClick={() => onMarkDayDone(day.id)}
        >
          Mark day done
        </button>
      </div>

      <div style={{ display: "grid", gap: "10px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", alignItems: "center" }}>
          <strong>{progress.percent}% ready</strong>
          <span style={{ color: "var(--voyage-text-muted)", fontSize: "0.88rem" }}>
            {progress.completedCount} of {progress.totalCount} complete
          </span>
        </div>
        <div
          aria-hidden="true"
          style={{
            width: "100%",
            height: "10px",
            borderRadius: "999px",
            overflow: "hidden",
            background: "rgba(160, 109, 72, 0.12)",
          }}
        >
          <div
            style={{
              width: `${progress.percent}%`,
              height: "100%",
              background: "linear-gradient(90deg, var(--voyage-secondary), var(--voyage-accent))",
            }}
          />
        </div>
      </div>

      {progress.isEmpty ? (
        <p style={{ margin: 0, color: "var(--voyage-text-muted)" }}>
          No locations have been added yet for this day.
        </p>
      ) : (
        <div style={{ display: "grid", gap: "10px" }}>
          {locations.map((location) => (
            <LocationChecklistRow
              key={location.id}
              dayId={day.id}
              location={location}
              onToggleLocation={onToggleLocation}
            />
          ))}
        </div>
      )}
    </article>
  );
}
