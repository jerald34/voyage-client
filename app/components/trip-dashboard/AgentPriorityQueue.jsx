import React from 'react';

export default function AgentPriorityQueue({ trips }) {
  const queue = [
    { id: 1, initials: 'HF', bg: '#D77A61', name: 'Harrington Family - Italy', subtext: 'Proposal due in 4h', level: 'High' },
    { id: 2, initials: 'JH', bg: '#B65D48', name: 'Johnson Honeymoon - Bali', subtext: 'Supplier response pending', level: 'High' },
    { id: 3, initials: 'EG', bg: '#4A5D67', name: 'Evans Group - Japan', subtext: 'Client asked for changes', level: 'Medium' },
    { id: 4, initials: 'TF', bg: '#7D8C94', name: 'Thompson Family - Costa Rica', subtext: 'Awaiting approval', level: 'Medium' }
  ];

  return (
    <div className="dashboard-card priority-queue">
      <div className="card-header">
        <div className="header-title">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#D77A61" strokeWidth="2"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>
          <h2>Priority Queue</h2>
          <span className="badge">4</span>
        </div>
        <button className="view-all">View all</button>
      </div>

      <div className="queue-list">
        {queue.map(item => (
          <div key={item.id} className="queue-item">
            <div className="avatar" style={{ backgroundColor: item.bg }}>{item.initials}</div>
            <div className="item-info">
              <strong>{item.name}</strong>
              <span>{item.subtext}</span>
            </div>
            <div className={`priority-pill ${item.level.toLowerCase()}`}>{item.level}</div>
          </div>
        ))}
      </div>

      <div className="card-footer">
        <button className="footer-link">+ New Itinerary</button>
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

        .avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 12px;
          font-weight: 600;
          flex-shrink: 0;
        }

        .item-info {
          display: flex;
          flex-direction: column;
          flex: 1;
          min-width: 0; /* allows text truncation */
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

        .priority-pill {
          padding: 4px 10px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 600;
          flex-shrink: 0;
        }

        .priority-pill.high {
          background: #FEF3C7;
          color: #D97706;
        }

        .priority-pill.medium {
          background: #F3F4F6;
          color: #4B5563;
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
