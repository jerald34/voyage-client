import ItineraryDayCard from "./ItineraryDayCard.jsx";

export default function ItineraryTimeline({ days, onMarkDayDone, onToggleLocation }) {
  const safeDays = Array.isArray(days) ? days : [];

  return (
    <section className="frame-panel" style={{ display: "grid", gap: "20px" }}>
      <div>
        <span className="frame-label">Timeline first</span>
        <h2 style={{ fontSize: "1.8rem", margin: "8px 0 10px" }}>Itinerary timeline</h2>
        <p className="lede" style={{ margin: 0 }}>
          Work through each day in order, complete locations as you go, and push a full day over the line when it is
          ready.
        </p>
      </div>

      <div style={{ display: "grid", gap: "18px" }}>
        {safeDays.map((day) => (
          <ItineraryDayCard
            key={day.id}
            day={day}
            onMarkDayDone={onMarkDayDone}
            onToggleLocation={onToggleLocation}
          />
        ))}
      </div>
    </section>
  );
}
