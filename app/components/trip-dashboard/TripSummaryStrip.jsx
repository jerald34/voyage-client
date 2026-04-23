const summaryItems = [
  { id: "travelers", label: "Travelers", getValue: (tripBrief) => `${tripBrief?.travelers ?? 0}` },
  { id: "pace", label: "Pace", getValue: (tripBrief) => tripBrief?.pace || "Set the rhythm" },
  { id: "budget", label: "Budget", getValue: (tripBrief) => tripBrief?.budget || "Budget pending" },
  {
    id: "progress",
    label: "Overall progress",
    getValue: (_tripBrief, tripProgress) => `${tripProgress?.percent ?? 0}%`,
  },
  {
    id: "next",
    label: "Next active day",
    getValue: (_tripBrief, _tripProgress, nextActiveDay) =>
      nextActiveDay ? `${nextActiveDay.label}: ${nextActiveDay.title}` : "Everything is lined up",
  },
];

export default function TripSummaryStrip({ nextActiveDay, tripBrief, tripProgress }) {
  return (
    <section aria-label="Trip summary" className="trip-summary-strip">
      {summaryItems.map((item) => (
        <article key={item.id} className="trip-summary-card">
          <span className="frame-label">{item.label}</span>
          <strong>{item.getValue(tripBrief, tripProgress, nextActiveDay)}</strong>
        </article>
      ))}
    </section>
  );
}
