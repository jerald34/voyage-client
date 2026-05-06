export default function ReviewScreen({ days, onBackToWorkspace, onShare, tripBrief }) {
  return (
    <section className="screen-frame">
      <div className="frame-panel">
        <span className="frame-label">Review</span>
        <h2>The Grand Tour</h2>
        <p className="lede">Final check of your itinerary for {tripBrief.destination}.</p>

        <div style={{ display: "grid", gap: "12px", marginBottom: "32px" }}>
          {days.map((day) => (
            <div key={day.id} className="day-card" style={{ padding: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <strong>
                  {day.label}: {day.title}
                </strong>
                <span style={{ fontSize: "0.8rem", color: "var(--text-dim)" }}>
                  {(day.locations ?? []).length} stops
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="button-stack">
          <button className="button button-secondary" onClick={onBackToWorkspace}>
            Adjust Plans
          </button>
          <button className="button button-primary" onClick={onShare}>
            Confirm Voyage
          </button>
        </div>
      </div>
    </section>
  );
}
