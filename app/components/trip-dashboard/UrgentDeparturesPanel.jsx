import React, { useMemo } from "react";

function formatDepartureLabel(trip) {
  if (typeof trip?.daysUntilDeparture === "number") {
    if (trip.daysUntilDeparture < 0) return "Departed";
    if (trip.daysUntilDeparture === 0) return "Departs today";
    if (trip.daysUntilDeparture === 1) return "Departs in 1 day";
    return `Departs in ${trip.daysUntilDeparture} days`;
  }

  if (typeof trip?.departureDate === "string" && trip.departureDate.trim()) {
    return trip.departureDate;
  }

  return "Departure pending";
}

export default function UrgentDeparturesPanel({ trips }) {
  const queue = useMemo(() => (Array.isArray(trips) ? trips : []), [trips]);

  return (
    <section className="dashboard-card urgent-departures" aria-label="Urgent departures">
      <div className="card-header">
        <div className="header-title">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#b65d48" strokeWidth="2">
            <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.2-1.1.6L3 8l6 4-3 3-3.2-.8c-.4-.1-.8.2-1 .6L1 16l4 2 2 4c.4.2.7-.2.6-.6l-.8-3.2 3-3 4 6c.4-.2.7-.6.6-1.1L16 13l8.2-8.2" />
          </svg>
          <div>
            <h2>Urgent Departures</h2>
            <p>Trips leaving within the next 30 days</p>
          </div>
        </div>
      </div>

      {queue.length > 0 ? (
        <div className="queue-list">
          {queue.map((item, index) => (
            <article key={item?.id ?? `${item?.clientName ?? "departure"}-${index}`} className="queue-item">
              <div className="date-stack">
                <span className="month">{item?.departureDate ? String(item.departureDate).slice(5, 7) : "--"}</span>
                <span className="day">{item?.departureDate ? String(item.departureDate).slice(-2) : "--"}</span>
              </div>
              <div className="item-info">
                <strong>{item?.clientName || "Client pending"}</strong>
                <span>{item?.destination || "Destination pending"}</span>
                <div className="meta-row">
                  <span>{item?.travelWindow || "Dates pending"}</span>
                </div>
              </div>
              <div className="status-column">
                <span className="status-pill">{formatDepartureLabel(item)}</span>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <strong>No departures need attention</strong>
          <p>Trips with departure dates in the next 30 days will appear here automatically.</p>
        </div>
      )}

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

        .queue-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
          flex: 1;
        }

        .queue-item {
          display: grid;
          grid-template-columns: auto minmax(0, 1fr) auto;
          gap: 12px;
          align-items: center;
          padding: 14px;
          border-radius: 16px;
          background: #f8fafc;
          border: 1px solid #eef2f7;
        }

        .date-stack {
          display: flex;
          flex-direction: column;
          align-items: center;
          flex-shrink: 0;
          min-width: 42px;
          gap: 2px;
        }

        .month {
          font-size: 10px;
          color: #6b7280;
          font-weight: 700;
          letter-spacing: 0.14em;
        }

        .day {
          font-size: 16px;
          color: #111827;
          font-weight: 800;
        }

        .item-info {
          display: grid;
          gap: 4px;
          min-width: 0;
        }

        .item-info strong {
          font-size: 14px;
          color: #111827;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .item-info > span,
        .meta-row span {
          font-size: 12px;
          color: #6b7280;
        }

        .meta-row {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }

        .status-column {
          display: flex;
          align-items: center;
          justify-content: flex-end;
        }

        .status-pill {
          padding: 6px 10px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 700;
          background: #ecfdf5;
          color: #047857;
          white-space: nowrap;
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

        @media (max-width: 1280px) {
          .queue-item {
            grid-template-columns: auto minmax(0, 1fr);
          }

          .status-column {
            grid-column: 1 / -1;
            justify-content: flex-start;
          }
        }
      `}</style>
    </section>
  );
}
