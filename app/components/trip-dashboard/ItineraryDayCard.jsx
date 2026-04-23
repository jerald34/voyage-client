import LocationChecklistRow from "./LocationChecklistRow.jsx";

export default function ItineraryDayCard({ day, isPrimaryDay = false, onMarkDayDone, onToggleLocation }) {
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
      aria-label={`Timeline day ${day?.label || "Day"}`}
      className={`trip-day-card${progress.isComplete ? " is-complete" : ""}`}
    >
      <div className="trip-day-card-header">
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
          aria-label={isPrimaryDay ? undefined : `Mark ${day?.label || "day"} done`}
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
        <div aria-hidden="true" className="trip-progress-bar">
          <div style={{ width: `${progress.percent}%` }} />
        </div>
      </div>

      {progress.isEmpty ? (
        <p style={{ margin: 0, color: "var(--voyage-text-muted)" }}>No locations have been added yet for this day.</p>
      ) : (
        <div className="trip-location-list">
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
