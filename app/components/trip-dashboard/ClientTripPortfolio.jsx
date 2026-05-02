import React, { useMemo } from "react";

function parseDate(dateValue) {
  if (typeof dateValue !== "string" || !dateValue.trim()) {
    return null;
  }

  const parsed = new Date(dateValue);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function getDaysUntilDeparture(trip) {
  const parsed = parseDate(trip?.departureDate);
  if (!parsed) return null;

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfTrip = new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
  return Math.ceil((startOfTrip.getTime() - startOfToday.getTime()) / 86400000);
}

function getStatusSummary(trip, daysUntilDeparture) {
  const approvalStatus = String(trip?.approvalStatus ?? "").toLowerCase();
  const readiness = Number(trip?.readinessPercent ?? 0);

  if (approvalStatus.includes("approved") && readiness >= 85) {
    return "Ready";
  }

  if (approvalStatus.includes("awaiting") || approvalStatus.includes("pending") || approvalStatus.includes("needs")) {
    return "Needs approval";
  }

  if (daysUntilDeparture !== null && daysUntilDeparture <= 7) {
    return "Urgent";
  }

  if (readiness >= 70) {
    return "In progress";
  }

  return "Pipeline";
}

function buildSummary(trips) {
  const safeTrips = Array.isArray(trips) ? trips : [];
  const activeTrips = safeTrips.filter((trip) => String(trip?.status ?? "active").toLowerCase() !== "archived");
  const withDepartureWindow = activeTrips
    .map((trip) => ({ trip, daysUntilDeparture: getDaysUntilDeparture(trip) }))
    .filter(({ daysUntilDeparture }) => daysUntilDeparture !== null);
  const departuresIn30Days = withDepartureWindow.filter(({ daysUntilDeparture }) => daysUntilDeparture >= 0 && daysUntilDeparture <= 30);
  const awaitingApproval = activeTrips.filter((trip) => {
    const approvalStatus = String(trip?.approvalStatus ?? "").toLowerCase();
    return approvalStatus.includes("awaiting") || approvalStatus.includes("pending") || approvalStatus.includes("needs");
  });
  const readyToGo = activeTrips.filter((trip) => String(trip?.approvalStatus ?? "").toLowerCase().includes("approved") && Number(trip?.readinessPercent ?? 0) >= 85);

  return {
    activeTrips: activeTrips.length,
    departuresIn30Days: departuresIn30Days.length,
    awaitingApproval: awaitingApproval.length,
    readyToGo: readyToGo.length,
    topTrips: activeTrips.slice(0, 4).map((trip) => ({
      ...trip,
      daysUntilDeparture: getDaysUntilDeparture(trip),
    })),
  };
}

export default function ClientTripPortfolio({ trips, summary, onOpenTrip }) {
  const portfolio = useMemo(() => buildSummary(trips), [trips]);
  const displaySummary = summary ? { ...portfolio, ...summary } : portfolio;
  const safeTrips = Array.isArray(trips) ? trips : [];

  return (
    <section className="dashboard-card client-portfolio" aria-label="Client trip portfolio">
      <div className="card-header">
        <div className="header-title">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#b65d48" strokeWidth="2">
            <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
          </svg>
          <div>
            <h2>Client Trip Portfolio</h2>
            <p>Portfolio-wide snapshot of the active agency trips</p>
          </div>
        </div>
      </div>

      <div className="portfolio-content">
        <div className="portfolio-metrics" aria-label="Agency portfolio metrics">
          <article className="metric-card">
            <span className="metric-label">Active trips</span>
            <strong>{displaySummary.activeTrips ?? 0}</strong>
          </article>
          <article className="metric-card">
            <span className="metric-label">Departures in 30 days</span>
            <strong>{displaySummary.departuresIn30Days ?? 0}</strong>
          </article>
          <article className="metric-card">
            <span className="metric-label">Awaiting approval</span>
            <strong>{displaySummary.awaitingApproval ?? 0}</strong>
          </article>
          <article className="metric-card">
            <span className="metric-label">Ready to go</span>
            <strong>{displaySummary.readyToGo ?? 0}</strong>
          </article>
        </div>

        {portfolio.topTrips.length > 0 ? (
          <div className="trip-list">
            {portfolio.topTrips.map((trip, index) => {
              const daysUntilDeparture = trip.daysUntilDeparture;
              const status = getStatusSummary(trip, daysUntilDeparture);
              return (
                <article key={trip?.id ?? `${trip?.clientName ?? "trip"}-${index}`} className="trip-item">
                  <div className="trip-main">
                    <strong>{trip?.clientName || "Client pending"}</strong>
                    <span>{trip?.destination || "Destination pending"}</span>
                    <div className="meta-row">
                      <span>{trip?.travelWindow || "Dates pending"}</span>
                      <span>{trip?.assignedOrganizer ? `Organizer: ${trip.assignedOrganizer}` : "Organizer pending"}</span>
                    </div>
                  </div>
                  <div className="trip-side">
                    <span className={`status-pill ${status.toLowerCase().replace(/\s+/g, "-")}`}>{status}</span>
                    <span className="readiness-pill">
                      {typeof trip?.readinessPercent === "number" ? `${trip.readinessPercent}% ready` : "Readiness pending"}
                    </span>
                    <button type="button" className="open-button" onClick={() => onOpenTrip?.(trip)}>
                      Open trip
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="empty-state">
            <strong>No active client trips yet</strong>
            <p>Add trips to the portfolio to surface readiness, approval, and departure status here.</p>
          </div>
        )}
      </div>

      <style jsx>{`
        .dashboard-card {
          background: rgba(255, 255, 255, 0.94);
          border-radius: 20px;
          border: 1px solid #e5e7eb;
          padding: 20px;
          display: flex;
          flex-direction: column;
          min-height: 320px;
          box-shadow: 0 18px 34px rgba(15, 23, 42, 0.04);
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 14px;
          margin-bottom: 18px;
        }

        .header-title {
          display: flex;
          align-items: flex-start;
          gap: 12px;
        }

        .header-title h2 {
          font-size: 16px;
          font-weight: 700;
          margin: 0 0 4px;
          color: #111827;
        }

        .header-title p {
          margin: 0;
          font-size: 12px;
          color: #6b7280;
          line-height: 1.5;
        }

        .badge {
          background: #f8fafc;
          color: #374151;
          font-size: 12px;
          padding: 6px 10px;
          border-radius: 999px;
          font-weight: 700;
          border: 1px solid #e5e7eb;
        }

        .portfolio-content {
          display: grid;
          gap: 14px;
          flex: 1;
        }

        .portfolio-metrics {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
        }

        .metric-card {
          padding: 14px;
          border-radius: 16px;
          background: #f8fafc;
          border: 1px solid #eef2f7;
          display: grid;
          gap: 6px;
        }

        .metric-label {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.14em;
          color: #6b7280;
          font-weight: 700;
        }

        .metric-card strong {
          font-size: 20px;
          color: #111827;
        }

        .trip-list {
          display: grid;
          gap: 12px;
        }

        .trip-item {
          display: flex;
          justify-content: space-between;
          gap: 16px;
          padding: 14px;
          border-radius: 16px;
          background: #f8fafc;
          border: 1px solid #eef2f7;
        }

        .trip-main {
          display: grid;
          gap: 4px;
          min-width: 0;
          flex: 1;
        }

        .trip-main strong {
          font-size: 14px;
          color: #111827;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .trip-main > span,
        .meta-row span {
          font-size: 12px;
          color: #6b7280;
        }

        .meta-row {
          display: flex;
          flex-wrap: wrap;
          gap: 8px 12px;
        }

        .trip-side {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 8px;
        }

        .status-pill,
        .readiness-pill {
          padding: 6px 10px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 700;
          white-space: nowrap;
        }

        .status-pill.urgent {
          background: #fee2e2;
          color: #b91c1c;
        }

        .status-pill.needs-approval {
          background: #fff7ed;
          color: #c2410c;
        }

        .status-pill.ready {
          background: #ecfdf5;
          color: #047857;
        }

        .status-pill.in-progress,
        .status-pill.pipeline {
          background: #eff6ff;
          color: #1d4ed8;
        }

        .readiness-pill {
          background: #f1f5f9;
          color: #334155;
        }

        .open-button {
          background: linear-gradient(135deg, #113437, #1f4d53);
          color: white;
          border: none;
          border-radius: 999px;
          padding: 9px 12px;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
        }

        .empty-state {
          padding: 22px;
          text-align: left;
          color: #4b5563;
          background: #f8fafc;
          border-radius: 16px;
          border: 1px dashed #d1d5db;
          display: grid;
          gap: 8px;
        }

        .empty-state strong {
          color: #111827;
          font-size: 14px;
        }

        .empty-state p {
          margin: 0;
          font-size: 13px;
          line-height: 1.6;
        }

        @media (max-width: 1200px) {
          .trip-item {
            flex-direction: column;
          }

          .trip-side {
            align-items: flex-start;
            flex-direction: row;
            flex-wrap: wrap;
          }
        }
      `}</style>
    </section>
  );
}
