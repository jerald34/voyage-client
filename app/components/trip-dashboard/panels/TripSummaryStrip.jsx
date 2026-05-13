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
    <section aria-label="Trip summary" className="grid grid-cols-5 gap-3 max-[980px]:grid-cols-2 max-[768px]:grid-cols-1">
      {summaryItems.map((item) => (
        <article key={item.id} className="p-4 bg-white/[0.92] border border-border/[0.12] rounded-md shadow-soft relative overflow-hidden">
          <span className="inline-flex items-center gap-2.5 text-secondary text-xs font-extrabold tracking-[0.18em] uppercase">
            <span className="w-11 h-px bg-current opacity-55" />
            {item.label}
          </span>
          <strong className="block mt-2.5 text-[0.95rem] text-text-primary">{item.getValue(tripBrief, tripProgress, nextActiveDay)}</strong>
        </article>
      ))}
    </section>
  );
}
