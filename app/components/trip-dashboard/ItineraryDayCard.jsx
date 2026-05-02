import React from "react";

export default function ItineraryDayCard({ day }) {
  const items = Array.isArray(day?.items) ? day.items : [];

  return (
    <article className="day-card">
      <header>
        <strong>Day {day?.dayNumber ?? "-"}</strong>
        <span>{day?.title || "Untitled day"}</span>
      </header>

      {items.length === 0 ? (
        <p className="empty">No activities generated for this day yet.</p>
      ) : (
        <ul>
          {items.slice(0, 5).map((item, index) => (
            <li key={`${day?.dayNumber ?? "day"}-${index}`}>
              <div className="row">
                <span className="type">{item.type || "ACTIVITY"}</span>
                <strong>{item.title || "Untitled activity"}</strong>
              </div>
              {item.description ? <p>{item.description}</p> : null}
            </li>
          ))}
        </ul>
      )}

      <style jsx>{`
        .day-card {
          border: 1px solid #e6e9ee;
          border-radius: 10px;
          padding: 12px;
          background: #fff;
          display: grid;
          gap: 10px;
        }
        header {
          display: flex;
          justify-content: space-between;
          gap: 8px;
          align-items: center;
        }
        header strong {
          color: #0f172a;
          font-size: 13px;
        }
        header span {
          color: #334155;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .empty {
          margin: 0;
          color: #6b7280;
          font-size: 13px;
        }
        ul {
          margin: 0;
          padding: 0;
          list-style: none;
          display: grid;
          gap: 8px;
        }
        li {
          border: 1px solid #edf1f5;
          border-radius: 8px;
          padding: 8px;
          background: #fafbfc;
          display: grid;
          gap: 6px;
        }
        .row {
          display: flex;
          gap: 8px;
          align-items: center;
        }
        .type {
          font-size: 10px;
          font-weight: 700;
          padding: 3px 6px;
          border-radius: 999px;
          border: 1px solid #dbe3ea;
          color: #475569;
          background: #f8fafc;
        }
        li strong {
          font-size: 13px;
          color: #0f172a;
        }
        li p {
          margin: 0;
          font-size: 12px;
          color: #475569;
          line-height: 1.35;
        }
      `}</style>
    </article>
  );
}
