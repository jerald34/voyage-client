"use client";
import Link from 'next/link';

export default function AgentThreadRail() {
  const mockThreads = [
    { id: '1', title: 'Tokyo Foodie Extravaganza', status: 'Draft', date: '2h ago' },
    { id: '2', title: 'Kyoto Cultural Immersion', status: 'Needs Review', date: '5h ago' },
    { id: '3', title: 'Hokkaido Winter Escape', status: 'Completed', date: 'Yesterday' },
  ];

  return (
    <div className="thread-rail-container">
      <header className="rail-header">
        <div className="agency-branding">
          <span className="agency-label">Agency Workspace</span>
          <h2 className="agency-name">Voyage Premium</h2>
        </div>
        <Link href="/agency" className="back-link">
          ← Dashboard
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
        <ul className="thread-list">
          {mockThreads.map(thread => (
            <li key={thread.id} className="thread-item">
              <div className="thread-info">
                <span className="thread-title">{thread.title}</span>
                <span className="thread-meta">{thread.date}</span>
              </div>
              <span className={`status-chip ${thread.status.toLowerCase().replace(' ', '-')}`}>
                {thread.status}
              </span>
            </li>
          ))}
        </ul>
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

        .thread-list {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .thread-item {
          padding: 12px;
          border-radius: var(--voyage-radius-sm);
          border: 1px solid var(--voyage-border);
          background: white;
          display: flex;
          flex-direction: column;
          gap: 8px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .thread-item:hover {
          border-color: var(--voyage-secondary);
          background: rgba(215, 122, 97, 0.02);
        }

        .thread-title {
          font-size: 13px;
          font-weight: 700;
          display: block;
          color: var(--voyage-text);
        }

        .thread-meta {
          font-size: 11px;
          color: var(--voyage-text-soft);
        }

        .status-chip {
          font-size: 10px;
          font-weight: 800;
          padding: 2px 6px;
          border-radius: 4px;
          align-self: flex-start;
          text-transform: uppercase;
        }

        .status-chip.draft {
          background: #eef2f3;
          color: #7d8c94;
        }

        .status-chip.needs-review {
          background: #fff4e5;
          color: #b7791f;
        }

        .status-chip.completed {
          background: #e6fffa;
          color: #2c7a7b;
        }
      `}</style>
    </div>
  );
}
