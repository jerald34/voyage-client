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

function getPriorityPillClass(label) {
  switch (label.toLowerCase()) {
    case "critical":
      return "bg-status-danger/10 text-status-danger";
    case "high":
      return "bg-status-warning/10 text-status-warning";
    default:
      return "bg-status-info/10 text-status-info";
  }
}

export default function AgentPriorityQueue({ trips }) {
  const queue = useMemo(() => (Array.isArray(trips) ? trips : []), [trips]);

  return (
    <section
      className="flex flex-col min-h-[280px] p-4 bg-surface/[0.94] border border-border/[0.14] rounded-[20px] shadow-soft"
      aria-label="Priority queue"
    >
      <div className="flex justify-between items-start gap-[14px] mb-[18px]">
        <div className="flex items-start gap-3">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#b65d48" strokeWidth="2">
            <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
            <line x1="4" y1="22" x2="4" y2="15" />
          </svg>
          <div>
            <h2 className="text-base font-bold mb-1 text-text-primary">Priority Queue</h2>
            <p className="m-0 text-xs text-text-muted leading-relaxed">Trips ranked by urgency and readiness</p>
          </div>
        </div>
      </div>

      {queue.length > 0 ? (
        <div className="flex flex-col gap-2 flex-1">
          {queue.map((item, index) => (
            <article
              key={item?.id ?? `${item?.clientName ?? "trip"}-${index}`}
              className="grid grid-cols-[auto_minmax(0,1fr)_auto] gap-3 items-center p-[14px] rounded-[16px] bg-background/50 border border-border/[0.08]"
            >
              <div className="w-[30px] h-[30px] rounded-[10px] flex items-center justify-center bg-gradient-to-br from-primary to-[#1f4d53] text-white text-xs font-extrabold shrink-0">
                {index + 1}
              </div>
              <div className="grid gap-1 min-w-0">
                <strong className="text-sm text-text-primary truncate">{item?.clientName || "Client pending"}</strong>
                <span className="text-xs text-text-muted">{item?.destination || "Destination pending"}</span>
                <div className="flex flex-wrap gap-y-2 gap-x-3">
                  <span className="text-xs text-text-muted">{item?.travelWindow || "Dates pending"}</span>
                  {item?.nextAction ? <span className="text-xs text-text-muted">{item.nextAction}</span> : null}
                </div>
              </div>
              <div className="flex flex-col items-end gap-1.5">
                <span
                  className={`px-2.5 py-1.5 rounded-pill text-[11px] font-extrabold whitespace-nowrap ${getPriorityPillClass(getPriorityLabel(item))}`}
                >
                  {getPriorityLabel(item)}
                </span>
                <span className="px-2.5 py-1.5 rounded-pill text-[11px] font-extrabold whitespace-nowrap bg-background/70 text-text-primary">
                  {getDeadlineLabel(item)}
                </span>
                <strong className="text-xs text-text-primary">
                  {typeof item?.readinessPercent === "number" ? `${item.readinessPercent}% ready` : "Readiness pending"}
                </strong>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="grid gap-2 p-[22px] bg-background/50 rounded-[16px] border border-dashed border-border/40">
          <strong className="text-sm text-text-primary">No trips in the priority queue</strong>
          <p className="m-0 text-[13px] text-text-muted leading-relaxed">
            Trips with upcoming departures, approval blockers, or lower readiness will surface here automatically.
          </p>
        </div>
      )}
    </section>
  );
}
