import React from 'react';

export default function ClientTripPortfolio({ trips, onOpenTrip }) {
  // Hardcoded values based on the design mockup for demonstration
  const totalTrips = 28;
  const stats = [
    { id: 1, label: "In Progress", count: 12, percentage: 43, color: "#113437" },
    { id: 2, label: "Upcoming", count: 9, percentage: 32, color: "#D77A61" },
    { id: 3, label: "Completed", count: 5, percentage: 18, color: "#D1D5DB" },
    { id: 4, label: "On Hold", count: 2, percentage: 7, color: "#E5E7EB" },
  ];

  return (
    <div className="dashboard-card client-portfolio">
      <div className="card-header">
        <div className="header-title">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#D77A61" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
          <h2>Client Trip Portfolio</h2>
          <span className="badge">28</span>
        </div>
        <button className="view-all">View all</button>
      </div>

      <div className="portfolio-content">
        <div className="chart-container">
          <svg viewBox="0 0 36 36" className="donut-chart">
            {/* Background circle */}
            <path className="circle-bg"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
            {/* In Progress - 43% */}
            <path className="circle"
              stroke="#113437"
              strokeDasharray="43, 100"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
            {/* Upcoming - 32% */}
            <path className="circle"
              stroke="#D77A61"
              strokeDasharray="32, 100"
              strokeDashoffset="-43"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
             {/* Completed - 18% */}
            <path className="circle"
              stroke="#D1D5DB"
              strokeDasharray="18, 100"
              strokeDashoffset="-75"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
             {/* On Hold - 7% */}
             <path className="circle"
              stroke="#E5E7EB"
              strokeDasharray="7, 100"
              strokeDashoffset="-93"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
            
            <g className="chart-text">
              <text x="18" y="16" className="chart-number">28</text>
              <text x="18" y="22" className="chart-label">Total Trips</text>
            </g>
          </svg>
        </div>

        <div className="portfolio-legend">
          {stats.map(stat => (
            <div key={stat.id} className="legend-item">
              <div className="legend-left">
                <span className="legend-dot" style={{ backgroundColor: stat.color }}></span>
                <span className="legend-label">{stat.label}</span>
              </div>
              <div className="legend-right">
                <span className="legend-count">{stat.count}</span>
                <span className="legend-percent">({stat.percentage}%)</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card-footer">
        <button className="footer-link">Go to Portfolio</button>
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

        .portfolio-content {
          display: flex;
          align-items: center;
          gap: 24px;
          flex: 1;
        }

        .chart-container {
          width: 120px;
          height: 120px;
          flex-shrink: 0;
        }

        .donut-chart {
          width: 100%;
          height: 100%;
        }

        .circle-bg {
          fill: none;
          stroke: #F3F4F6;
          stroke-width: 3.8;
        }

        .circle {
          fill: none;
          stroke-width: 6;
          stroke-linecap: butt;
          transition: stroke-dasharray 1s ease-out;
        }

        .chart-text {
          text-anchor: middle;
        }

        .chart-number {
          font-size: 8px;
          font-weight: 700;
          fill: #111827;
        }

        .chart-label {
          font-size: 4px;
          fill: #6B7280;
        }

        .portfolio-legend {
          display: flex;
          flex-direction: column;
          gap: 12px;
          flex: 1;
        }

        .legend-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 13px;
        }

        .legend-left {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .legend-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }

        .legend-label {
          color: #374151;
          font-weight: 500;
        }

        .legend-right {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .legend-count {
          color: #111827;
          font-weight: 600;
        }

        .legend-percent {
          color: #9CA3AF;
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

        @media (max-width: 1400px) {
          .portfolio-content {
            flex-direction: column;
            align-items: flex-start;
          }
        }
      `}</style>
    </div>
  );
}
