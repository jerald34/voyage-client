"use client";
import ItineraryDayPanel from './ItineraryDayPanel';

export default function ItineraryCanvas({ itinerary }) {
  if (!itinerary) {
    return (
      <div className="itinerary-canvas-empty">
        <div className="empty-graphic">📜</div>
        <h3>No Draft Created Yet</h3>
        <p>Describe the trip in the chat to see the structured itinerary appear here.</p>
      </div>
    );
  }

  const { title, summary, status, version, days = [] } = itinerary;

  return (
    <div className="itinerary-canvas">
      <header className="canvas-header">
        <div className="trip-meta-top">
          <span className="draft-badge">{status === 'DRAFT' ? 'Draft Itinerary' : status}</span>
          <h1 className="trip-title">{title}</h1>
        </div>
        <div className="trip-meta-details">
          {summary && (
            <div className="meta-item">
              <span className="meta-label">Summary</span>
              <span className="meta-value">{summary}</span>
            </div>
          )}
          <div className="meta-item">
            <span className="meta-label">Days</span>
            <span className="meta-value">{days.length}</span>
          </div>
          {version > 1 && (
            <div className="meta-item">
              <span className="meta-label">Version</span>
              <span className="meta-value">v{version}</span>
            </div>
          )}
        </div>
      </header>

      <div className="canvas-content">
        {days.map((day, index) => (
          <ItineraryDayPanel 
            key={index}
            dayNumber={day.dayNumber}
            date={day.date}
            title={day.title}
            items={day.items}
          />
        ))}
      </div>

      <style jsx>{`
        .itinerary-canvas {
          padding: 32px;
          background: var(--voyage-surface);
          min-height: 100%;
        }

        .canvas-header {
          margin-bottom: 40px;
        }

        .trip-meta-top {
          margin-bottom: 16px;
        }

        .draft-badge {
          display: inline-block;
          font-size: 10px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: var(--voyage-secondary);
          border: 1px solid var(--voyage-secondary);
          padding: 2px 8px;
          border-radius: 4px;
          margin-bottom: 12px;
        }

        .trip-title {
          font-family: "DM Serif Display", serif;
          font-size: 32px;
          color: var(--voyage-primary);
          line-height: 1.1;
        }

        .trip-meta-details {
          display: flex;
          gap: 32px;
          padding-top: 16px;
          border-top: 1px solid var(--voyage-border);
        }

        .meta-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .meta-label {
          font-size: 10px;
          font-weight: 800;
          text-transform: uppercase;
          color: var(--voyage-text-soft);
          letter-spacing: 0.05em;
        }

        .meta-value {
          font-size: 14px;
          font-weight: 700;
          color: var(--voyage-primary);
        }

        .itinerary-canvas-empty {
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px;
          text-align: center;
          color: var(--voyage-text-soft);
          background: white;
        }

        .empty-graphic {
          font-size: 48px;
          margin-bottom: 24px;
          opacity: 0.5;
        }

        .itinerary-canvas-empty h3 {
          font-family: "DM Serif Display", serif;
          font-size: 24px;
          color: var(--voyage-primary);
          margin-bottom: 12px;
        }

        .itinerary-canvas-empty p {
          font-size: 14px;
          max-width: 300px;
          line-height: 1.5;
        }
      `}</style>
    </div>
  );
}
