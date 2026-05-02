import React from 'react';

export default function UrgentDeparturesPanel({ trips }) {
  const queue = [
    { id: 1, month: 'MAY', day: '24', name: 'Anderson Family - Greece', subtext: 'Departs in 2 days' },
    { id: 2, month: 'MAY', day: '25', name: 'Chen Family - Portugal', subtext: 'Departs in 3 days' },
    { id: 3, month: 'MAY', day: '26', name: 'Williams - Iceland', subtext: 'Departs in 4 days' }
  ];

  return (
    <div className="dashboard-card urgent-departures">
      <div className="card-header">
        <div className="header-title">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#D77A61" strokeWidth="2"><path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.2-1.1.6L3 8l6 4-3 3-3.2-.8c-.4-.1-.8.2-1 .6L1 16l4 2 2 4c.4.2.7-.2.6-.6l-.8-3.2 3-3 4 6c.4-.2.7-.6.6-1.1L16 13l8.2-8.2"/></svg>
          <h2>Urgent Departures</h2>
          <span className="badge">3</span>
        </div>
        <button className="view-all">View all</button>
      </div>

      <div className="queue-list">
        {queue.map(item => (
          <div key={item.id} className="queue-item">
            <div className="date-stack">
              <span className="month">{item.month}</span>
              <span className="day">{item.day}</span>
            </div>
            <div className="item-info">
              <strong>{item.name}</strong>
              <span>{item.subtext}</span>
            </div>
            <div className="status-pill">In Progress</div>
          </div>
        ))}
      </div>

      <div className="card-footer">
        <button className="footer-link">Go to Departures</button>
      </div>

      <style jsx>{`
        .dashboard-card {
          background: white;
          border-radius: 12px;
          border: 1px solid #E5E7EB;
          padding: 24px;
          display: flex;
          flex-direction: column;
          height: 100%;
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }

        .header-title {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .header-title h2 {
          font-size: 16px;
          font-weight: 600;
          margin: 0;
          color: #111827;
        }

        .badge {
          background: #F3F4F6;
          color: #374151;
          font-size: 12px;
          padding: 2px 8px;
          border-radius: 12px;
          font-weight: 500;
        }

        .view-all {
          background: none;
          border: none;
          color: #6B7280;
          font-size: 13px;
          cursor: pointer;
        }

        .queue-list {
          display: flex;
          flex-direction: column;
          gap: 20px;
          flex: 1;
        }

        .queue-item {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .date-stack {
          display: flex;
          flex-direction: column;
          align-items: center;
          flex-shrink: 0;
          min-width: 32px;
        }

        .month {
          font-size: 10px;
          color: #6B7280;
          font-weight: 600;
          text-transform: uppercase;
        }

        .day {
          font-size: 16px;
          color: #111827;
          font-weight: 700;
        }

        .item-info {
          display: flex;
          flex-direction: column;
          flex: 1;
          min-width: 0;
        }

        .item-info strong {
          font-size: 14px;
          color: #111827;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .item-info span {
          font-size: 12px;
          color: #6B7280;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .status-pill {
          padding: 4px 10px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 600;
          background: #ECFDF5;
          color: #059669;
          flex-shrink: 0;
          white-space: nowrap;
        }

        .card-footer {
          margin-top: 24px;
          text-align: center;
          border-top: 1px solid #E5E7EB;
          padding-top: 16px;
        }

        .footer-link {
          background: none;
          border: none;
          color: #6B7280;
          font-size: 13px;
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}
