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
    <section
      className="relative overflow-hidden grid grid-cols-[minmax(0,1.15fr)_minmax(280px,0.85fr)] gap-6 p-7 md:px-8 items-center bg-white/[0.92] border border-border rounded-lg shadow-strong"
      style={{
        background:
          "linear-gradient(90deg, rgba(239,241,243,1) 45%, rgba(247,243,238,0) 100%), url('/hero-bg.png') center/cover no-repeat",
      }}
    >
      <div className="grid gap-4 min-w-0">
        <span className="inline-flex items-center gap-2.5 text-secondary text-xs font-extrabold tracking-[0.18em] uppercase">
          Active trip
        </span>
        <h1 className="font-serif text-[2rem] md:text-[2.5rem] text-primary leading-tight">Your itinerary at a glance</h1>
        <p className="text-[1.08rem] text-text-muted m-0">
          Keep {destination} moving with a timeline-first dashboard, route context, and quick completion actions before
          you hand things off to the Voyage Agent.
        </p>
      </div>

      <div className="grid gap-3 content-start p-[22px] rounded-[calc(28px-6px)] bg-white/[0.74] border border-primary/[0.08] shadow-soft">
        <strong className="text-[1.28rem] text-primary">{destination}</strong>
        <p className="m-0 text-text-muted">{travelWindow}</p>

        <div className="flex flex-wrap gap-2.5">
          {[
            getCountdownLabel(travelWindow),
            `${tripProgress?.percent ?? 0}% complete`,
            nextActiveDay ? `${nextActiveDay.label}: ${nextActiveDay.title}` : "Timeline ready",
          ].map((label) => (
            <span
              key={label}
              className="px-[14px] py-2.5 rounded-pill bg-white/[0.78] border border-primary/[0.08] text-[0.86rem] font-bold"
            >
              {label}
            </span>
          ))}
        </div>

        <p className="m-0 text-text-muted">
          A little momentum here means a smoother agent kickoff and a more confident trip.
        </p>

        <button
          className="inline-flex items-center justify-center gap-2 min-h-[54px] px-7 py-4 rounded-pill font-extrabold bg-accent text-white hover:-translate-y-0.5 transition cursor-pointer border-0"
          type="button"
          onClick={onContinue}
        >
          Initialize Voyage Agent
        </button>
      </div>
    </section>
  );
}
