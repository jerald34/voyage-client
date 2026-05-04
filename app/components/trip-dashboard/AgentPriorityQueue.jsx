import React, { useMemo } from "react";

function getPriorityLabel(trip) {
  if (typeof trip?.priorityScore === "number" && trip.priorityScore >= 70) {
    return "Critical";
  }

  if (typeof trip?.priorityScore === "number" && trip.priorityScore >= 45) {
    return "High";
  }

  return "Priority";
}

function getDeadlineLabel(trip) {
  if (typeof trip?.daysUntilDeparture === "number") {
    if (trip.daysUntilDeparture < 0) return "Departed";
    if (trip.daysUntilDeparture === 0) return "Today";
    if (trip.daysUntilDeparture === 1) return "1 day";
    return `${trip.daysUntilDeparture} days`;
  }

  return "Date pending";
}

export default function AgentPriorityQueue({ trips }) {
  const queue = useMemo(() => (Array.isArray(trips) ? trips : []), [trips]);

  return (
    <section className="dashboard-card priority-queue" aria-label="Priority queue">
      <div className="card-header">
        <div className="header-title">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#b65d48" strokeWidth="2">
            <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
            <line x1="4" y1="22" x2="4" y2="15" />
          </svg>
          <div>
            <h2>Priority Queue</h2>
            <p>Trips ranked by urgency and readiness</p>
          </div>
        </div>
      </div>

      {queue.length > 0 ? (
        <div className="queue-list">
          {queue.map((item, index) => (
            <article key={item?.id ?? `${item?.clientName ?? "trip"}-${index}`} className="queue-item">
              <div className="rank-badge">{index + 1}</div>
              <div className="item-info">
                <strong>{item?.clientName || "Client pending"}</strong>
                <span>{item?.destination || "Destination pending"}</span>
                <div className="meta-row">
                  <span>{item?.travelWindow || "Dates pending"}</span>
                  {item?.nextAction ? <span>{item.nextAction}</span> : null}
                </div>
              </div>
              <div className="right-column">
                <span className={`priority-pill ${getPriorityLabel(item).toLowerCase()}`}>{getPriorityLabel(item)}</span>
                <span className="deadline-pill">{getDeadlineLabel(item)}</span>
                <strong className="readiness">{typeof item?.readinessPercent === "number" ? `${item.readinessPercent}% ready` : "Readiness pending"}</strong>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <strong>No trips in the priority queue</strong>
          <p>Trips with upcoming departures, approval blockers, or lower readiness will surface here automatically.</p>
        </div>
      )}

      <style jsx>{`
        .dashboard-card {
          background: rgba(255, 255, 255, 0.94);
          border-radius: 20px;
          border: 1px solid #e5e7eb;
          padding: 16px;
          display: flex;
          flex-direction: column;
          min-height: 280px;
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
          gap: 8px;
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

        .rank-badge {
          width: 30px;
          height: 30px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #113437, #1f4d53);
          color: white;
          font-size: 12px;
          font-weight: 700;
          flex-shrink: 0;
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
          flex-wrap: wrap;
          gap: 8px 12px;
        }

        .meta-row span + span {
          position: relative;
        }

        .meta-row span + span::before {
          content: "";
        }

        .right-column {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 6px;
        }

        .priority-pill,
        .deadline-pill {
          padding: 6px 10px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 700;
          white-space: nowrap;
        }

        .priority-pill.critical {
          background: #fee2e2;
          color: #b91c1c;
        }

        .priority-pill.high {
          background: #fff7ed;
          color: #c2410c;
        }

        .priority-pill.priority {
          background: #ecfeff;
          color: #0f766e;
        }

        .deadline-pill {
          background: #f1f5f9;
          color: #334155;
        }

        .readiness {
          font-size: 12px;
          color: #111827;
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

          .right-column {
            grid-column: 1 / -1;
            align-items: flex-start;
            flex-direction: row;
            flex-wrap: wrap;
          }
        }

        @media (max-width: 600px) {
          .dashboard-card {
            padding: 16px;
            min-height: auto;
          }

          .queue-item {
            padding: 12px;
          }

          .item-info strong {
            font-size: 13px;
          }
        }
      `}</style>
    </section>
  );
}
