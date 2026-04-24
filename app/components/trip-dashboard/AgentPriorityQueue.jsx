function getDepartureLabel(daysUntilDeparture) {
  if (typeof daysUntilDeparture !== "number") {
    return "Departure date pending";
  }

  if (daysUntilDeparture === 0) {
    return "Departs today";
  }

  if (daysUntilDeparture === 1) {
    return "Departs tomorrow";
  }

  return `Departs in ${daysUntilDeparture} days`;
}

function getReadinessPercent(readinessPercent) {
  const numericReadiness = Number(readinessPercent);

  if (!Number.isFinite(numericReadiness)) {
    return 0;
  }

  return Math.min(100, Math.max(0, numericReadiness));
}

export default function AgentPriorityQueue({ onTripAction, trips }) {
  const safeTrips = Array.isArray(trips) ? trips : [];
  const canRunTripAction = typeof onTripAction === "function";

  return (
    <section className="agency-panel frame-panel">
      <div className="agency-panel-heading">
        <span className="frame-label">Agent ranked</span>
        <h2>Priority Queue</h2>
      </div>

      {safeTrips.length === 0 ? (
        <p className="agency-empty-state">No active client trips yet.</p>
      ) : (
        <div className="agency-priority-list">
          {safeTrips.map((trip) => {
            const readinessPercent = getReadinessPercent(trip.readinessPercent);

            return (
              <article key={trip.id} className="agency-priority-item">
                <div>
                  <strong>{trip.clientName || "Unnamed client"}</strong>
                  <span>{trip.destination || "Destination pending"}</span>
                </div>
                <p>{trip.agentInsight || "Agent review pending."}</p>
                <div className="agency-trip-meta">
                  <span>{getDepartureLabel(trip.daysUntilDeparture)}</span>
                  <span>Ready {readinessPercent}%</span>
                  <span>{trip.approvalStatus || "Approval not requested"}</span>
                </div>
                <button
                  className="button button-secondary"
                  disabled={!canRunTripAction}
                  onClick={canRunTripAction ? () => onTripAction(trip) : undefined}
                  type="button"
                >
                  {trip.nextAction || "Open trip"}
                </button>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
