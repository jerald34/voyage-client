import React, { useMemo } from "react";

function getStatusBadge(approvalStatus) {
  const value = String(approvalStatus ?? "").toLowerCase();

  if (!value) return "Review";
  if (value.includes("approved")) return "Approved";
  if (value.includes("changes")) return "Changes needed";
  if (value.includes("pending") || value.includes("awaiting") || value.includes("needs")) return "Needs review";
  return "Review";
}

export default function ApprovalQueuePanel({ trips }) {
  const queue = useMemo(() => (Array.isArray(trips) ? trips : []), [trips]);

  return (
    <section className="dashboard-card approval-queue" aria-label="Approval queue">
      <div className="card-header">
        <div className="header-title">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#b65d48" strokeWidth="2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <path d="m9 12 2 2 4-4" />
          </svg>
          <div>
            <h2>Approval Queue</h2>
            <p>Trips waiting on client sign-off or final checks</p>
          </div>
        </div>
      </div>

      {queue.length > 0 ? (
        <div className="queue-list">
          {queue.map((item, index) => (
            <article key={item?.id ?? `${item?.clientName ?? "approval"}-${index}`} className="queue-item">
              <div className="item-info">
                <strong>{item?.clientName || "Client pending"}</strong>
                <span>{item?.destination || "Destination pending"}</span>
                <div className="subtext-row">
                  <span>{item?.approvalStatus || "Approval status pending"}</span>
                  <span className="readiness">{typeof item?.readinessPercent === "number" ? `${item.readinessPercent}% ready` : "Readiness pending"}</span>
                </div>
              </div>
              <div className="action-column">
                <span className={`review-pill ${getStatusBadge(item?.approvalStatus).toLowerCase().replace(/\s+/g, "-")}`}>
                  {getStatusBadge(item?.approvalStatus)}
                </span>
                {item?.nextAction ? <span className="next-action">{item.nextAction}</span> : null}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <strong>No client approvals are blocking production</strong>
          <p>When an itinerary needs sign-off, the blocker will appear here with the latest approval status.</p>
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
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          padding: 14px;
          border-radius: 16px;
          background: #f8fafc;
          border: 1px solid #eef2f7;
        }

        .item-info {
          display: grid;
          gap: 4px;
          min-width: 0;
          flex: 1;
        }

        .item-info strong {
          font-size: 14px;
          color: #111827;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .item-info > span,
        .subtext-row span,
        .next-action {
          font-size: 12px;
          color: #6b7280;
        }

        .subtext-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
        }

        .readiness {
          color: #111827;
          font-weight: 700;
        }

        .action-column {
          display: grid;
          justify-items: end;
          gap: 8px;
          min-width: 0;
        }

        .review-pill {
          padding: 6px 10px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 700;
          white-space: nowrap;
        }

        .review-pill.needs-review {
          background: #fff7ed;
          color: #c2410c;
        }

        .review-pill.approved {
          background: #ecfdf5;
          color: #047857;
        }

        .review-pill.changes-needed {
          background: #fee2e2;
          color: #b91c1c;
        }

        .review-pill.review {
          background: #eff6ff;
          color: #1d4ed8;
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
          .queue-item {
            flex-direction: column;
          }

          .action-column {
            justify-items: start;
          }
        }
      `}</style>
    </section>
  );
}
