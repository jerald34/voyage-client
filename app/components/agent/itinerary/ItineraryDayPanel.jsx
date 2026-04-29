"use client";
import ItineraryItemRow from './ItineraryItemRow';

export default function ItineraryDayPanel({ dayNumber, date, items = [] }) {
  return (
    <div className="itinerary-day-panel">
      <header className="day-header">
        <div className="day-label">Day {dayNumber}</div>
        <div className="day-date">{date}</div>
      </header>
      <div className="day-content">
        {items.length > 0 ? (
          items.map((item, index) => (
            <ItineraryItemRow key={index} item={item} />
          ))
        ) : (
          <div className="empty-day">No items scheduled for this day yet.</div>
        )}
      </div>

      <style jsx>{`
        .itinerary-day-panel {
          margin-bottom: 24px;
          border: 1px solid var(--voyage-border-strong);
          border-radius: 8px;
          overflow: hidden;
          background: white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.02);
        }

        .day-header {
          padding: 12px 16px;
          background: var(--voyage-background);
          border-bottom: 1px solid var(--voyage-border-strong);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .day-label {
          font-family: "DM Serif Display", serif;
          font-size: 18px;
          color: var(--voyage-primary);
        }

        .day-date {
          font-size: 12px;
          font-weight: 700;
          color: var(--voyage-text-soft);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .empty-day {
          padding: 24px;
          text-align: center;
          font-size: 13px;
          color: var(--voyage-text-soft);
          font-style: italic;
        }
      `}</style>
    </div>
  );
}
