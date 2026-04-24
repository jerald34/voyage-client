function getReadinessPercent(readinessPercent) {
  const numericReadiness = Number(readinessPercent);

  if (!Number.isFinite(numericReadiness)) {
    return 0;
  }

  return Math.min(100, Math.max(0, numericReadiness));
}

export default function UrgentDeparturesPanel({ trips }) {
  const safeTrips = Array.isArray(trips) ? trips : [];

  return (
    <section className="agency-panel frame-panel">
      <div className="agency-panel-heading">
        <span className="frame-label">Departures soon</span>
        <h2>Urgent Departures</h2>
      </div>

      {safeTrips.length === 0 ? (
        <p className="agency-empty-state">No departures need attention this week.</p>
      ) : (
        <div className="agency-compact-list">
          {safeTrips.map((trip) => {
            const readinessPercent = getReadinessPercent(trip.readinessPercent);

            return (
              <article key={trip.id} className="agency-compact-row">
                <div>
                  <strong>{trip.clientName || "Unnamed client"}</strong>
                  <span>{trip.destination || "Destination pending"}</span>
                </div>
                <div className="agency-trip-meta">
                  <span>{trip.travelWindow || "Dates pending"}</span>
                  <span>Ready {readinessPercent}%</span>
                  <span>{trip.riskLevel || "Risk pending"}</span>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
