import ItineraryDayCard from "./ItineraryDayCard.jsx";

export default function ItineraryTimeline({ days, onMarkDayDone, onToggleLocation }) {
  const safeDays = Array.isArray(days) ? days : [];

  return (
    <section className="bg-surface/92 border border-border/12 rounded-lg shadow-strong backdrop-blur-[18px] p-6" style={{ display: "grid", gap: "20px" }}>
      <div>
        <span className="inline-flex items-center gap-2.5 text-secondary text-xs font-extrabold tracking-[0.18em] uppercase">Timeline first</span>
        <h2 style={{ fontSize: "1.8rem", margin: "8px 0 10px" }}>Itinerary timeline</h2>
        <p className="text-text-muted text-base leading-relaxed" style={{ margin: 0 }}>
          Work through each day in order, check off each stop as the route firms up, and send complete days forward
          when they feel ready.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        {safeDays.map((day, index) => (
          <ItineraryDayCard
            key={day.id}
            day={day}
            isPrimaryDay={index === 0}
            onMarkDayDone={onMarkDayDone}
            onToggleLocation={onToggleLocation}
          />
        ))}
      </div>
    </section>
  );
}
