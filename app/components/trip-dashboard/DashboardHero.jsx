function getStartDateLabel(travelWindow) {
  if (typeof travelWindow !== "string") {
    return null;
  }

  const match = travelWindow.match(/^([A-Za-z]+)\s+(\d{1,2})/);
  const yearMatch = travelWindow.match(/(\d{4})/);

  if (!match || !yearMatch) {
    return null;
  }

  return `${match[1]} ${match[2]}, ${yearMatch[1]}`;
}

function getCountdownLabel(travelWindow) {
  const startDateLabel = getStartDateLabel(travelWindow);

  if (!startDateLabel) {
    return "Planning mode";
  }

  const startDate = new Date(startDateLabel);

  if (Number.isNaN(startDate.getTime())) {
    return "Planning mode";
  }

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfTrip = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
  const differenceInDays = Math.round((startOfTrip.getTime() - startOfToday.getTime()) / 86400000);

  if (differenceInDays > 1) {
    return `${differenceInDays} days to go`;
  }

  if (differenceInDays === 1) {
    return "1 day to go";
  }

  if (differenceInDays === 0) {
    return "Starts today";
  }

  return "Planning mode";
}

export default function DashboardHero({ nextActiveDay, onContinue, tripBrief, tripProgress }) {
  const destination = tripBrief?.destination || "Active trip";
  const travelWindow = tripBrief?.travelWindow || "Dates pending";

  return (
    <section
      className="frame-panel"
      style={{
        display: "grid",
        gap: "24px",
        gridTemplateColumns: "minmax(0, 1.7fr) minmax(260px, 1fr)",
        alignItems: "start",
      }}
    >
      <div style={{ display: "grid", gap: "14px" }}>
        <span className="frame-label">Planner Dashboard</span>
        <h1 style={{ fontSize: "clamp(2.4rem, 4vw, 4rem)", margin: 0 }}>{destination}</h1>
        <p className="lede" style={{ margin: 0 }}>
          {travelWindow}
        </p>
        <p style={{ margin: 0, color: "var(--voyage-text-muted)" }}>
          Stay on top of the route, knock out each location, and keep the next day ready before you enter the full
          workspace.
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gap: "14px",
          padding: "20px",
          borderRadius: "var(--voyage-radius-md)",
          background: "rgba(255,255,255,0.55)",
          border: "1px solid var(--voyage-border)",
        }}
      >
        <span className="frame-label">{getCountdownLabel(travelWindow)}</span>
        <div>
          <strong style={{ display: "block", fontSize: "1.05rem" }}>{tripProgress?.percent ?? 0}% complete</strong>
          <span style={{ color: "var(--voyage-text-muted)", fontSize: "0.92rem" }}>
            {(tripProgress?.completedCount ?? 0)} of {(tripProgress?.totalCount ?? 0)} itinerary stops checked off
          </span>
        </div>
        <div>
          <strong style={{ display: "block", fontSize: "1rem" }}>Next active day</strong>
          <span style={{ color: "var(--voyage-text-muted)", fontSize: "0.92rem" }}>
            {nextActiveDay ? `${nextActiveDay.label}: ${nextActiveDay.title}` : "Timeline ready to plan"}
          </span>
        </div>
        <button className="button button-primary" type="button" onClick={onContinue}>
          Continue to agent kickoff
        </button>
      </div>
    </section>
  );
}
