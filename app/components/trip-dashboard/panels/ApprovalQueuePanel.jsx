import React, { useMemo } from "react";

function getStatusBadge(approvalStatus) {
  const value = String(approvalStatus ?? "").toLowerCase();

  if (!value) return "Review";
  if (value.includes("approved")) return "Approved";
  if (value.includes("changes")) return "Changes needed";
  if (value.includes("pending") || value.includes("awaiting") || value.includes("needs")) return "Needs review";
  return "Review";
}

function getStatusPillClass(badge) {
  switch (badge) {
    case "Approved":
      return "bg-status-success/10 text-status-success";
    case "Needs review":
      return "bg-status-warning/10 text-status-warning";
    case "Changes needed":
      return "bg-status-danger/10 text-status-danger";
    default:
      return "bg-status-info/10 text-status-info";
  }
}

export default function ApprovalQueuePanel({ trips }) {
  const queue = useMemo(() => (Array.isArray(trips) ? trips : []), [trips]);

  return (
    <section
      className="flex flex-col min-h-[280px] p-4 bg-surface/[0.94] border border-border/[0.14] rounded-[20px] shadow-soft"
      aria-label="Approval queue"
    >
      <div className="flex justify-between items-start gap-[14px] mb-[18px]">
        <div className="flex items-start gap-3">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#b65d48" strokeWidth="2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <path d="m9 12 2 2 4-4" />
          </svg>
          <div>
            <h2 className="text-base font-bold mb-1 text-text-primary">Approval Queue</h2>
            <p className="m-0 text-xs text-text-muted leading-relaxed">Trips waiting on client sign-off or final checks</p>
          </div>
        </div>
      </div>

      {queue.length > 0 ? (
        <div className="flex flex-col gap-2 flex-1">
          {queue.map((item, index) => (
            <article
              key={item?.id ?? `${item?.clientName ?? "approval"}-${index}`}
              className="flex items-start justify-between gap-4 p-[14px] rounded-[16px] bg-background/50 border border-border/[0.08]"
            >
              <div className="grid gap-1 min-w-0 flex-1">
                <strong className="text-sm text-text-primary truncate">{item?.clientName || "Client pending"}</strong>
                <span className="text-xs text-text-muted">{item?.destination || "Destination pending"}</span>
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <span className="text-xs text-text-muted">{item?.approvalStatus || "Approval status pending"}</span>
                  <span className="text-xs font-bold text-text-primary">
                    {typeof item?.readinessPercent === "number" ? `${item.readinessPercent}% ready` : "Readiness pending"}
                  </span>
                </div>
              </div>
              <div className="grid justify-items-end gap-2 min-w-0">
                <span
                  className={`px-2.5 py-1.5 rounded-pill text-[11px] font-extrabold whitespace-nowrap ${getStatusPillClass(getStatusBadge(item?.approvalStatus))}`}
                >
                  {getStatusBadge(item?.approvalStatus)}
                </span>
                {item?.nextAction ? (
                  <span className="text-xs text-text-muted">{item.nextAction}</span>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="grid gap-2 p-[22px] bg-background/50 rounded-[16px] border border-dashed border-border/40">
          <strong className="text-sm text-text-primary">No client approvals are blocking production</strong>
          <p className="m-0 text-[13px] text-text-muted leading-relaxed">
            When an itinerary needs sign-off, the blocker will appear here with the latest approval status.
          </p>
        </div>
      )}
    </section>
  );
}
