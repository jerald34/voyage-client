import prototypeData from "../prototype-data";

const workspaceTabs = [
  { id: "trip", label: "Trip" },
  { id: "map", label: "Map" },
  { id: "agent", label: "Agent" },
  { id: "share", label: "Share" },
];

export default function WorkspaceScreen({
  activeWorkspaceTab,
  agentMessages,
  days,
  onReviewTrip,
  onSelectDay,
  onSelectPlace,
  onTabChange,
  selectedDay,
  selectedDayId,
  selectedPlace,
  tripBrief,
}) {
  return (
    <section className="screen-frame screen-editor">
      <aside
        className="frame-panel frame-panel-nav"
        style={{ padding: "0", background: "transparent", border: "none", boxShadow: "none" }}
      >
        <div className="frame-panel workspace-header-container">
          <span className="frame-label">Voyage</span>
          <h3 style={{ fontSize: "1.5rem" }}>{tripBrief.destination}</h3>
          <p style={{ fontSize: "0.8rem", color: "var(--text-dim)", marginTop: "8px" }}>{tripBrief.travelWindow}</p>
        </div>

        <div role="tablist" aria-label="Workspace sections" className="workspace-tabs-container">
          {workspaceTabs.map((tab) => (
            <button
              key={tab.id}
              className={`topbar-chip ${activeWorkspaceTab === tab.id ? "active" : ""}`}
              role="tab"
              aria-selected={activeWorkspaceTab === tab.id}
              onClick={() => onTabChange(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="frame-panel" style={{ padding: "24px" }}>
          <span className="frame-label">Timeline</span>
          <div className="workspace-days-container">
            {days.map((day) => (
              <button
                key={day.id}
                className={`day-pill ${selectedDayId === day.id ? "active" : ""}`}
                style={{ width: "100%", textAlign: "left" }}
                onClick={() => onSelectDay(day.id)}
              >
                <span>{day.label}</span>
                <strong style={{ fontSize: "0.9rem" }}>{day.title}</strong>
              </button>
            ))}
          </div>
        </div>
      </aside>

      <main className="frame-panel frame-panel-board">
        {activeWorkspaceTab === "trip" && (
          <div className="day-split">
            <div>
              <span className="frame-label">Voyage agent</span>
              <h3>{selectedDay?.title ?? "Planning Overview"}</h3>
              <p className="lede" style={{ marginBottom: "1rem" }}>
                Refine the rhythm of your days. Drag and drop stops to reorder.
              </p>
            </div>

            <div style={{ display: "grid", gap: "20px" }}>
              {days.map((day) => (
                <article
                  key={day.id}
                  className={`day-card ${selectedDayId === day.id ? "selected" : ""}`}
                  style={{ borderLeft: selectedDayId === day.id ? "4px solid var(--accent)" : "" }}
                >
                  <div className="day-card-head">
                    <div>
                      <span className="frame-label">{day.label}</span>
                      <strong style={{ fontSize: "1.3rem" }}>{day.title}</strong>
                    </div>
                    <button
                      className="button button-secondary"
                      style={{ padding: "8px 16px", fontSize: "0.8rem" }}
                      onClick={() => onSelectDay(day.id)}
                    >
                      {selectedDayId === day.id ? "Active" : "Focus"}
                    </button>
                  </div>

                  <div style={{ display: "grid", gap: "8px" }}>
                    {day.stops.map((stop) => (
                      <div key={stop} className="activity-chip">
                        <span className="chip-drag"></span>
                        <span style={{ fontSize: "0.95rem" }}>{stop}</span>
                      </div>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}

        {activeWorkspaceTab === "map" && (
          <div className="day-split">
            <div>
              <span className="frame-label">Spatial Planning</span>
              <h3>Map Discovery</h3>
              <p className="lede">Anchors and potential stops clustered for efficiency.</p>
            </div>

            <div className="day-card" style={{ background: "var(--accent-glow)", borderColor: "var(--accent)" }}>
              <span className="frame-label" style={{ color: "var(--text-main)" }}>
                Selected place
              </span>
              <h4 style={{ fontSize: "1.2rem", marginBottom: "8px" }}>
                {selectedPlace?.name ?? "Select a point on the map"}
              </h4>
              <p style={{ color: "var(--text-main)", opacity: 0.8 }}>{selectedPlace?.note}</p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "16px" }}>
              {prototypeData.mapPlaces.map((place) => (
                <button
                  key={place.id}
                  className={`day-card ${selectedPlace?.id === place.id ? "selected" : ""}`}
                  style={{ textAlign: "left", cursor: "pointer" }}
                  onClick={() => onSelectPlace(place.id)}
                >
                  <span style={{ fontSize: "0.7rem", color: "var(--accent)" }}>{place.district}</span>
                  <strong style={{ display: "block", fontSize: "1rem", marginTop: "4px" }}>{place.name}</strong>
                </button>
              ))}
            </div>
          </div>
        )}

        {activeWorkspaceTab === "agent" && (
          <div className="day-split">
            <div>
              <span className="frame-label">Voyage agent</span>
              <h3>Voyage Agent</h3>
              <p className="lede">Conversational refinement for your itinerary.</p>
            </div>

            <div style={{ display: "grid", gap: "16px" }}>
              {agentMessages.map((msg) => (
                <div
                  key={msg.id}
                  className="share-row"
                  style={{ borderLeft: msg.role === "assistant" ? "2px solid var(--accent)" : "2px solid var(--text-dim)" }}
                >
                  <strong>{msg.role === "assistant" ? "Voyage Agent" : "You"}</strong>
                  <p>{msg.text}</p>
                </div>
              ))}
            </div>

            <div className="input-row" style={{ marginTop: "20px" }}>
              <input
                type="text"
                placeholder="Ask about reservations, clusters, or pace..."
                style={{
                  background: "var(--bg-glass)",
                  border: "1px solid var(--border-glass)",
                  borderRadius: "var(--radius-md)",
                  padding: "16px",
                  color: "#fff",
                  width: "100%",
                }}
              />
            </div>
          </div>
        )}

        {activeWorkspaceTab === "share" && (
          <div className="day-split">
            <div>
              <span className="frame-label">Deployment</span>
              <h3>Trip Finalization</h3>
              <p className="lede">Exporting your plans to high-fidelity formats.</p>
            </div>
            <div className="day-card">
              <p>Ready to deploy your itinerary for {tripBrief.destination}.</p>
              <button className="button button-primary" style={{ marginTop: "16px" }} onClick={onReviewTrip}>
                Review & Export
              </button>
            </div>
          </div>
        )}
      </main>

      <aside className="frame-panel frame-panel-detail">
        <span className="frame-label">Quick Insights</span>

        <div className="detail-block">
          <p>Context</p>
          <strong style={{ fontSize: "1rem", marginBottom: "8px", display: "block" }}>{tripBrief.destination}</strong>
          <ul style={{ fontSize: "0.85rem" }}>
            <li>{tripBrief.travelers} Travelers</li>
            <li>{tripBrief.pace}</li>
            <li>Budget: {tripBrief.budget}</li>
          </ul>
        </div>

        {selectedDay && (
          <div className="detail-block">
            <p>Active Day: {selectedDay.label}</p>
            <strong style={{ fontSize: "1rem", marginBottom: "8px", display: "block" }}>{selectedDay.title}</strong>
            <ul>
              {selectedDay.stops.map((stop) => (
                <li key={stop}>{stop}</li>
              ))}
            </ul>
          </div>
        )}

        <div style={{ marginTop: "auto" }}>
          <button className="button button-primary" style={{ width: "100%" }} onClick={onReviewTrip}>
            Final Review
          </button>
        </div>
      </aside>
    </section>
  );
}
