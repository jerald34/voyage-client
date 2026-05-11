const metricItems = [
  { id: "activeTrips", label: "Active trips" },
  { id: "departuresIn30Days", label: "Departures in 30 days" },
  { id: "awaitingApproval", label: "Awaiting approval" },
  { id: "atRisk", label: "At risk" },
];

export default function AgencyMetricStrip({ summary }) {
  return (
    <section aria-label="Agency portfolio metrics" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {metricItems.map((item) => (
        <article key={item.id} className="grid gap-3.5 min-w-0 p-5 border border-border/12 rounded-md bg-surface/90 shadow-soft">
          <span className="inline-flex items-center gap-2.5 text-secondary text-xs font-extrabold tracking-[0.18em] uppercase">
            {item.label}
          </span>
          <strong className="font-serif text-[2.45rem] font-normal leading-[0.95] text-primary">
            {summary?.[item.id] ?? 0}
          </strong>
        </article>
      ))}
    </section>
  );
}
