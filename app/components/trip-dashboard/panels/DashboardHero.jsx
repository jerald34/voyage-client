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
  const destination = tripBrief?.destination || "Trip in planning";
  const travelWindow = tripBrief?.travelWindow || "Dates pending";

  return (
    <section className="trip-dashboard-hero frame-panel">
      <div className="trip-hero-copy">
        <span className="frame-label">Active trip</span>
        <h1>Your itinerary at a glance</h1>
        <p className="lede">
          Keep {destination} moving with a timeline-first dashboard, route context, and quick completion actions before
          you hand things off to the Voyage Agent.
        </p>
      </div>

      <div className="trip-hero-summary">
        <strong>{destination}</strong>
        <p>{travelWindow}</p>

        <div className="trip-hero-badges">
          <span>{getCountdownLabel(travelWindow)}</span>
          <span>{tripProgress?.percent ?? 0}% complete</span>
          <span>{nextActiveDay ? `${nextActiveDay.label}: ${nextActiveDay.title}` : "Timeline ready"}</span>
        </div>

        <p className="trip-hero-note">A little momentum here means a smoother agent kickoff and a more confident trip.</p>

        <button className="button button-primary" type="button" onClick={onContinue}>
          Initialize Voyage Agent
        </button>
      </div>
    </section>
  );
}
