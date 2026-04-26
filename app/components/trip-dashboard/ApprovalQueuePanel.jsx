export default function ApprovalQueuePanel({ trips }) {
  const safeTrips = Array.isArray(trips) ? trips : [];

  return (
    <section className="agency-panel frame-panel">
      <div className="agency-panel-heading">
        <span className="frame-label">Client blockers</span>
        <h2>Approval Blockers</h2>
      </div>

      {safeTrips.length === 0 ? (
        <p className="agency-empty-state">No client approvals are blocking production.</p>
      ) : (
        <div className="agency-compact-list">
          {safeTrips.map((trip) => (
            <article key={trip.id} className="agency-compact-row">
              <div>
                <strong>{trip.clientName || "Unnamed client"}</strong>
                <span>{trip.destination || "Destination pending"}</span>
              </div>
              <div className="agency-trip-meta">
                <span>{trip.approvalStatus || "Approval not requested"}</span>
                <span>{trip.nextAction || "Next action pending"}</span>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
