function getReadinessPercent(readinessPercent) {
  const numericReadiness = Number(readinessPercent);

  if (!Number.isFinite(numericReadiness)) {
    return 0;
  }

  return Math.min(100, Math.max(0, numericReadiness));
}

export default function ClientTripPortfolio({ onOpenTrip, trips }) {
  const safeTrips = Array.isArray(trips) ? trips : [];
  const canOpenTrip = typeof onOpenTrip === "function";

  return (
    <section className="agency-panel frame-panel">
      <div className="agency-panel-heading">
        <span className="frame-label">All active trips</span>
        <h2>Client Trip Portfolio</h2>
      </div>

      {safeTrips.length === 0 ? (
        <p className="agency-empty-state">No active client trips yet.</p>
      ) : (
        <div className="agency-portfolio-grid">
          {safeTrips.map((trip) => {
            const readinessPercent = getReadinessPercent(trip.readinessPercent);

            return (
              <article key={trip.id} className="agency-trip-card">
                <div className="agency-trip-card-header">
                  <div>
                    <strong>{trip.clientName || "Unnamed client"}</strong>
                    <span>{trip.destination || "Destination pending"}</span>
                  </div>
                  <span className={`agency-risk-pill risk-${String(trip.riskLevel || "pending").toLowerCase()}`}>
                    {trip.riskLevel || "Risk pending"}
                  </span>
                </div>
                <div className="agency-readiness">
                  <div>
                    <span>Ready {readinessPercent}%</span>
                    <span>{trip.travelWindow || "Dates pending"}</span>
                  </div>
                  <div aria-hidden="true" className="agency-readiness-bar">
                    <div style={{ width: `${readinessPercent}%` }} />
                  </div>
                </div>
                <dl className="agency-trip-details">
                  <div>
                    <dt>Organizer</dt>
                    <dd>{trip.assignedOrganizer || "Organizer unassigned"}</dd>
                  </div>
                  <div>
                    <dt>Approval</dt>
                    <dd>{trip.approvalStatus || "Approval not requested"}</dd>
                  </div>
                  <div>
                    <dt>Next action</dt>
                    <dd>{trip.nextAction || "Next action pending"}</dd>
                  </div>
                </dl>
                <button
                  className="button button-secondary"
                  disabled={!canOpenTrip}
                  onClick={canOpenTrip ? () => onOpenTrip(trip) : undefined}
                  type="button"
                >
                  Open trip
                </button>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
