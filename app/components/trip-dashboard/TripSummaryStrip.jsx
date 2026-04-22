const summaryItems = [
  { id: "travelers", label: "Travelers", getValue: (tripBrief) => `${tripBrief?.travelers ?? 0}` },
  { id: "pace", label: "Pace", getValue: (tripBrief) => tripBrief?.pace || "Set the rhythm" },
  { id: "budget", label: "Budget", getValue: (tripBrief) => tripBrief?.budget || "Budget pending" },
  { id: "progress", label: "Progress", getValue: (_tripBrief, tripProgress) => `${tripProgress?.percent ?? 0}% complete` },
  {
    id: "next",
    label: "Next up",
    getValue: (_tripBrief, _tripProgress, nextActiveDay) =>
      nextActiveDay ? `${nextActiveDay.label}: ${nextActiveDay.title}` : "Everything is lined up",
  },
];

export default function TripSummaryStrip({ nextActiveDay, tripBrief, tripProgress }) {
  return (
    <section
      aria-label="Trip summary"
      style={{
        display: "grid",
        gap: "14px",
        gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
      }}
    >
      {summaryItems.map((item) => (
        <article
          key={item.id}
          className="frame-panel"
          style={{ padding: "18px 20px", background: "rgba(255,255,255,0.72)" }}
        >
          <span className="frame-label">{item.label}</span>
          <strong style={{ display: "block", marginTop: "10px", fontSize: "1rem" }}>
            {item.getValue(tripBrief, tripProgress, nextActiveDay)}
          </strong>
        </article>
      ))}
    </section>
  );
}
