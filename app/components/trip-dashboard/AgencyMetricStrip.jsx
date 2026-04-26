const metricItems = [
  { id: "activeTrips", label: "Active trips" },
  { id: "departuresIn30Days", label: "Departures in 30 days" },
  { id: "awaitingApproval", label: "Awaiting approval" },
  { id: "atRisk", label: "At risk" },
];

export default function AgencyMetricStrip({ summary }) {
  return (
    <section aria-label="Agency portfolio metrics" className="agency-metric-strip">
      {metricItems.map((item) => (
        <article key={item.id} className="agency-metric-card">
          <span className="frame-label">{item.label}</span>
          <strong>{summary?.[item.id] ?? 0}</strong>
        </article>
      ))}
    </section>
  );
}
