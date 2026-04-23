export default function MapOverviewPanel({ tripBrief, mapHighlights }) {
  const highlights = Array.isArray(mapHighlights) ? mapHighlights.slice(0, 3) : [];
  const destination = tripBrief?.destination || "this trip";

  return (
    <section className="trip-map-panel frame-panel">
      <div>
        <span className="frame-label">Route overview</span>
        <h2>Route overview</h2>
        <p className="lede">A fast visual pass across the neighborhoods shaping {destination}.</p>
      </div>

      <div className="trip-map-canvas">
        <div className="trip-map-route" aria-hidden="true" />
        {highlights.length > 0 ? (
          highlights.map((highlight, index) => (
            <div key={`${highlight.label}-${highlight.value}`} className={`trip-map-pin trip-map-pin-${index + 1}`}>
              <span>{highlight.label}</span>
              <strong>{highlight.value}</strong>
            </div>
          ))
        ) : (
          <div className="trip-map-pin trip-map-pin-1">
            <span>Planning view</span>
            <strong>Add itinerary locations to preview the route</strong>
          </div>
        )}
      </div>
    </section>
  );
}
