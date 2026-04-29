"use client";

export default function ItineraryItemRow({ item }) {
  const { type, time, title, subtitle, metadata, isNew } = item;

  const getTypeIcon = (type) => {
    switch (type.toLowerCase()) {
      case 'activity': return '📍';
      case 'meal': return '🍽️';
      case 'transfer': return '🚗';
      case 'check-in': return '🔑';
      default: return '•';
    }
  };

  return (
    <div className={`itinerary-item-row ${isNew ? 'flash-update' : ''}`}>
      <div className="item-time">{time}</div>
      <div className="item-icon">{getTypeIcon(type)}</div>
      <div className="item-details">
        <div className="item-title">{title}</div>
        {subtitle && <div className="item-subtitle">{subtitle}</div>}
        {metadata && (
          <div className="item-metadata">
            {metadata.location && <span className="meta-badge location">{metadata.location}</span>}
            {metadata.duration && <span className="meta-badge duration">{metadata.duration}</span>}
            {metadata.source && <span className="meta-badge source">{metadata.source}</span>}
          </div>
        )}
      </div>

      <style jsx>{`
        .itinerary-item-row {
          display: grid;
          grid-template-columns: 60px 30px 1fr;
          gap: 12px;
          padding: 12px;
          border-bottom: 1px solid var(--voyage-border);
          background: white;
          transition: background 0.5s ease;
        }

        .itinerary-item-row:last-child {
          border-bottom: none;
        }

        .item-time {
          font-size: 11px;
          font-weight: 700;
          color: var(--voyage-text-soft);
          padding-top: 2px;
        }

        .item-icon {
          font-size: 14px;
          padding-top: 1px;
        }

        .item-title {
          font-size: 14px;
          font-weight: 700;
          color: var(--voyage-primary);
          margin-bottom: 2px;
        }

        .item-subtitle {
          font-size: 12px;
          color: var(--voyage-text-muted);
          margin-bottom: 6px;
        }

        .item-metadata {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }

        .meta-badge {
          font-size: 10px;
          font-weight: 700;
          padding: 2px 6px;
          border-radius: 4px;
          background: var(--voyage-background);
          color: var(--voyage-text-soft);
          text-transform: uppercase;
        }

        .meta-badge.location {
          background: #eef2f3;
          color: var(--voyage-primary);
        }

        .meta-badge.source {
          background: rgba(215, 122, 97, 0.1);
          color: var(--voyage-secondary);
        }

        @keyframes flash {
          0% { background: rgba(215, 122, 97, 0.2); }
          100% { background: white; }
        }

        .flash-update {
          animation: flash 2s ease-out;
        }
      `}</style>
    </div>
  );
}
