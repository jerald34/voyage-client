import ItineraryDayCard from "./ItineraryDayCard.jsx";

export default function ItineraryTimeline({ days, onMarkDayDone, onToggleLocation }) {
  const safeDays = Array.isArray(days) ? days : [];

  return (
    <section className="frame-panel" style={{ display: "grid", gap: "20px" }}>
      <div>
        <span className="frame-label">Timeline first</span>
        <h2 style={{ fontSize: "1.8rem", margin: "8px 0 10px" }}>Itinerary timeline</h2>
        <p className="lede" style={{ margin: 0 }}>
          Work through each day in order, check off each stop as the route firms up, and send complete days forward
          when they feel ready.
        </p>
      </div>

      <div className="trip-timeline-list">
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
