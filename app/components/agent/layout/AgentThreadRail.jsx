"use client";
import Link from 'next/link';

export default function AgentThreadRail() {
  return (
    <div className="thread-rail-container">
      <header className="rail-header">
        <div className="agency-branding">
          <span className="agency-label">Agency Workspace</span>
          <h2 className="agency-name">Voyage Premium</h2>
        </div>
        <Link href="/agency" className="back-link">
          {"<-"} Dashboard
        </Link>
      </header>

      <div className="rail-actions">
        <button className="new-thread-btn">
          <span className="btn-icon">+</span>
          New Itinerary Draft
        </button>
      </div>

      <nav className="thread-list-nav">
        <h3 className="section-title">Recent Threads</h3>
        <div className="thread-empty-state">
          <strong>No recent threads loaded</strong>
          <span>Start or select an itinerary thread to populate this rail.</span>
        </div>
      </nav>

      <style jsx>{`
        .thread-rail-container {
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 32px;
          height: 100%;
        }

        .rail-header {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .agency-label {
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: var(--voyage-text-soft);
          font-weight: 700;
        }

        .agency-name {
          font-size: 1.25rem;
          margin: 0;
          color: var(--voyage-primary);
        }

        .back-link {
          font-size: 12px;
          color: var(--voyage-secondary);
          text-decoration: none;
          font-weight: 600;
        }

        .new-thread-btn {
          width: 100%;
          padding: 12px;
          background: var(--voyage-primary);
          color: white;
          border: none;
          border-radius: var(--voyage-radius-sm);
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          cursor: pointer;
          transition: transform 0.2s;
        }

        .new-thread-btn:hover {
          transform: translateY(-1px);
        }

        .section-title {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--voyage-text-muted);
          margin-bottom: 16px;
        }

        .thread-empty-state {
          display: grid;
          gap: 8px;
          padding: 12px;
          border-radius: var(--voyage-radius-sm);
          border: 1px solid var(--voyage-border);
          background: white;
        }

        .thread-empty-state strong {
          font-size: 13px;
          font-weight: 700;
          color: var(--voyage-text);
        }

        .thread-empty-state span {
          font-size: 11px;
          color: var(--voyage-text-soft);
          line-height: 1.5;
        }
      `}</style>
    </div>
  );
}
