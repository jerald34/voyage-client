import React from 'react';

export default function ApprovalQueuePanel({ trips }) {
  const queue = [
    { id: 1, name: 'Lopez Family - Switzerland', subtext: 'Draft v2 • Updated May 20', price: '$9,200' },
    { id: 2, name: 'Patel Group - South Africa', subtext: 'Draft v1 • Updated May 19', price: '$14,850' }
  ];

  return (
    <div className="dashboard-card approval-queue">
      <div className="card-header">
        <div className="header-title">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#D77A61" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>
          <h2>Approval Queue</h2>
          <span className="badge">2</span>
        </div>
        <button className="view-all">View all</button>
      </div>

      <div className="queue-list">
        {queue.map(item => (
          <div key={item.id} className="queue-item">
            <div className="item-info">
              <strong>{item.name}</strong>
              <div className="subtext-row">
                <span>{item.subtext}</span>
                <span className="price">{item.price}</span>
              </div>
            </div>
            <button className="review-btn">Review</button>
          </div>
        ))}
      </div>

      <div className="card-footer">
        <button className="footer-link">Go to Approvals</button>
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
          justify-content: space-between;
          gap: 16px;
          padding-bottom: 20px;
          border-bottom: 1px solid #F3F4F6;
        }

        .queue-item:last-child {
          border-bottom: none;
          padding-bottom: 0;
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

        .subtext-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: 4px;
        }

        .subtext-row span {
          font-size: 12px;
          color: #6B7280;
        }

        .subtext-row .price {
          font-weight: 500;
          color: #374151;
        }

        .review-btn {
          background: #FFF7ED;
          border: 1px solid #FFEDD5;
          color: #D97706;
          padding: 6px 16px;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          flex-shrink: 0;
          transition: all 0.2s;
        }

        .review-btn:hover {
          background: #FFEDD5;
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
