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

function getStatusPillClass(status) {
  switch (status) {
    case "Urgent":
      return "bg-status-danger/10 text-status-danger";
    case "Needs approval":
      return "bg-status-warning/10 text-status-warning";
    case "Ready":
      return "bg-status-success/10 text-status-success";
    default:
      return "bg-status-info/10 text-status-info";
  }
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

  return (
    <section
      className="flex flex-col min-h-[280px] p-4 bg-surface/[0.94] border border-border/[0.14] rounded-[20px] shadow-soft"
      aria-label="Client trip portfolio"
    >
      <div className="flex justify-between items-start gap-[14px] mb-[18px]">
        <div className="flex items-start gap-3">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#b65d48" strokeWidth="2">
            <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
          </svg>
          <div>
            <h2 className="text-base font-bold mb-1 text-text-primary">Client Trip Portfolio</h2>
            <p className="m-0 text-xs text-text-muted leading-relaxed">Portfolio-wide snapshot of the active agency trips</p>
          </div>
        </div>
      </div>

      <div className="grid gap-2 flex-1">
        <div className="grid grid-cols-2 gap-2" aria-label="Agency portfolio metrics">
          {[
            { label: "Active trips", value: displaySummary.activeTrips ?? 0 },
            { label: "Departures in 30 days", value: displaySummary.departuresIn30Days ?? 0 },
            { label: "Awaiting approval", value: displaySummary.awaitingApproval ?? 0 },
            { label: "Ready to go", value: displaySummary.readyToGo ?? 0 },
          ].map(({ label, value }) => (
            <article key={label} className="grid gap-1.5 p-[14px] rounded-[16px] bg-background/50 border border-border/[0.08]">
              <span className="text-[11px] uppercase tracking-[0.14em] text-text-muted font-extrabold">{label}</span>
              <strong className="text-xl text-text-primary">{value}</strong>
            </article>
          ))}
        </div>

        {portfolio.topTrips.length > 0 ? (
          <div className="grid gap-3">
            {portfolio.topTrips.map((trip, index) => {
              const daysUntilDeparture = trip.daysUntilDeparture;
              const status = getStatusSummary(trip, daysUntilDeparture);
              return (
                <article
                  key={trip?.id ?? `${trip?.clientName ?? "trip"}-${index}`}
                  className="flex justify-between gap-4 p-[14px] rounded-[16px] bg-background/50 border border-border/[0.08]"
                >
                  <div className="grid gap-1 min-w-0 flex-1">
                    <strong className="text-sm text-text-primary truncate">{trip?.clientName || "Client pending"}</strong>
                    <span className="text-xs text-text-muted">{trip?.destination || "Destination pending"}</span>
                    <div className="flex flex-wrap gap-y-2 gap-x-3">
                      <span className="text-xs text-text-muted">{trip?.travelWindow || "Dates pending"}</span>
                      <span className="text-xs text-text-muted">
                        {trip?.assignedOrganizer ? `Organizer: ${trip.assignedOrganizer}` : "Organizer pending"}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={`px-2.5 py-1.5 rounded-pill text-[11px] font-extrabold whitespace-nowrap ${getStatusPillClass(status)}`}>
                      {status}
                    </span>
                    <span className="px-2.5 py-1.5 rounded-pill text-[11px] font-extrabold whitespace-nowrap bg-background/70 text-text-primary">
                      {typeof trip?.readinessPercent === "number" ? `${trip.readinessPercent}% ready` : "Readiness pending"}
                    </span>
                    <button
                      type="button"
                      className="px-3 py-[9px] rounded-pill text-xs font-extrabold bg-gradient-to-br from-primary to-[#1f4d53] text-white cursor-pointer border-0"
                      onClick={() => onOpenTrip?.(trip)}
                    >
                      Open trip
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="grid gap-2 p-[22px] bg-background/50 rounded-[16px] border border-dashed border-border/40">
            <strong className="text-sm text-text-primary">No active client trips yet</strong>
            <p className="m-0 text-[13px] text-text-muted leading-relaxed">
              Add trips to the portfolio to surface readiness, approval, and departure status here.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
