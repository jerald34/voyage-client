"use client";

export default function AgentSourcesDrawer({ sources = [] }) {
  if (sources.length === 0) return null;

  return (
    <div className="agent-sources-drawer">
      <h3 className="section-title">Knowledge Sources</h3>
      <div className="sources-list">
        {sources.map((source, index) => (
          <a 
            key={index} 
            href={source.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="source-card"
          >
            <div className="source-header">
              <span className="source-title">{source.title}</span>
              <svg className="external-icon" viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                <polyline points="15 3 21 3 21 9"></polyline>
                <line x1="10" y1="14" x2="21" y2="3"></line>
              </svg>
            </div>
            <p className="source-snippet">{source.snippet}</p>
            <span className="source-url">{new URL(source.url).hostname}</span>
          </a>
        ))}
      </div>

      <style jsx>{`
        .agent-sources-drawer {
          padding: 16px;
        }

        .section-title {
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: var(--voyage-text-soft);
          font-weight: 800;
          margin-bottom: 12px;
        }

        .sources-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .source-card {
          display: block;
          padding: 12px;
          background: white;
          border: 1px solid var(--voyage-border);
          border-radius: 8px;
          text-decoration: none;
          color: inherit;
          transition: all 0.2s;
        }

        .source-card:hover {
          border-color: var(--voyage-secondary);
          transform: translateY(-1px);
          box-shadow: var(--voyage-shadow-soft);
        }

        .source-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 8px;
          margin-bottom: 4px;
        }

        .source-title {
          font-size: 13px;
          font-weight: 700;
          color: var(--voyage-primary);
        }

        .external-icon {
          color: var(--voyage-text-soft);
          flex-shrink: 0;
          margin-top: 2px;
        }

        .source-snippet {
          font-size: 11px;
          color: var(--voyage-text-muted);
          line-height: 1.4;
          margin-bottom: 8px;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .source-url {
          font-size: 10px;
          font-weight: 600;
          color: var(--voyage-secondary);
        }
      `}</style>
    </div>
  );
}
