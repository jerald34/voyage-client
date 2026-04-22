export default function MapOverviewPanel({ destination, mapHighlights }) {
  const highlights = Array.isArray(mapHighlights) ? mapHighlights : [];

  return (
    <section className="frame-panel" style={{ display: "grid", gap: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: "16px", alignItems: "start" }}>
        <div>
          <span className="frame-label">Route energy</span>
          <h2 style={{ fontSize: "1.7rem", margin: "8px 0 10px" }}>Route overview</h2>
          <p className="lede" style={{ margin: 0 }}>
            A map-ready snapshot of the current route through {destination || "your trip"}.
          </p>
        </div>
        <div
          aria-hidden="true"
          style={{
            minWidth: "120px",
            minHeight: "96px",
            borderRadius: "var(--voyage-radius-md)",
            border: "1px solid rgba(216, 180, 160, 0.45)",
            background:
              "radial-gradient(circle at 30% 35%, rgba(223, 192, 174, 0.7), transparent 38%), linear-gradient(145deg, rgba(248, 236, 227, 0.95), rgba(255, 255, 255, 0.88))",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <span style={{ position: "absolute", left: "18%", top: "28%", fontSize: "1.1rem" }}>•</span>
          <span style={{ position: "absolute", left: "48%", top: "58%", fontSize: "1.1rem" }}>•</span>
          <span style={{ position: "absolute", left: "72%", top: "34%", fontSize: "1.1rem" }}>•</span>
          <div
            style={{
              position: "absolute",
              inset: "32% 18% auto 18%",
              borderTop: "2px dashed rgba(160, 109, 72, 0.55)",
              transform: "rotate(8deg)",
            }}
          />
        </div>
      </div>

      <div style={{ display: "grid", gap: "12px", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
        {highlights.length > 0 ? (
          highlights.map((highlight) => (
            <div
              key={`${highlight.label}-${highlight.value}`}
              className="day-card"
              style={{ padding: "16px", background: "rgba(255,255,255,0.72)" }}
            >
              <span className="frame-label">{highlight.label}</span>
              <strong style={{ display: "block", marginTop: "10px", fontSize: "1rem" }}>{highlight.value}</strong>
            </div>
          ))
        ) : (
          <div className="day-card" style={{ padding: "16px" }}>
            <span className="frame-label">Planning view</span>
            <strong style={{ display: "block", marginTop: "10px", fontSize: "1rem" }}>
              Add itinerary locations to preview the route
            </strong>
          </div>
        )}
      </div>
    </section>
  );
}
