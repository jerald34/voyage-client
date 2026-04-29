"use client";
import { useState } from 'react';

export default function AgentToolCallList({ toolCalls = [] }) {
  const [expandedId, setExpandedId] = useState(null);

  if (toolCalls.length === 0) return null;

  return (
    <div className="agent-tool-calls">
      <h3 className="section-title">Tool Inspections</h3>
      <div className="tool-items">
        {toolCalls.map((tool, index) => (
          <div key={index} className={`tool-item ${tool.status.toLowerCase()}`}>
            <div 
              className="tool-header"
              onClick={() => setExpandedId(expandedId === index ? null : index)}
            >
              <div className="tool-main">
                <span className="tool-name">{tool.name}</span>
                <span className="tool-status-badge">{tool.status}</span>
              </div>
              <span className="expand-icon">{expandedId === index ? '−' : '+'}</span>
            </div>
            
            {expandedId === index && (
              <div className="tool-details">
                <div className="detail-block">
                  <span className="detail-label">Input</span>
                  <pre className="detail-json">{JSON.stringify(tool.input, null, 2)}</pre>
                </div>
                {tool.output && (
                  <div className="detail-block">
                    <span className="detail-label">Output</span>
                    <pre className="detail-json">{JSON.stringify(tool.output, null, 2)}</pre>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <style jsx>{`
        .agent-tool-calls {
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

        .tool-items {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .tool-item {
          border: 1px solid var(--voyage-border);
          border-radius: 6px;
          overflow: hidden;
          background: white;
        }

        .tool-header {
          padding: 10px 12px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          cursor: pointer;
          background: rgba(0, 0, 0, 0.02);
          transition: background 0.2s;
        }

        .tool-header:hover {
          background: rgba(0, 0, 0, 0.04);
        }

        .tool-main {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .tool-name {
          font-family: var(--font-mono);
          font-size: 12px;
          color: var(--voyage-primary);
          font-weight: 600;
        }

        .tool-status-badge {
          font-size: 9px;
          font-weight: 800;
          text-transform: uppercase;
          padding: 2px 6px;
          border-radius: 4px;
          background: var(--voyage-background);
          color: var(--voyage-text-muted);
        }

        .tool-item.running .tool-status-badge {
          background: #fff4e5;
          color: #b7791f;
        }

        .tool-item.completed .tool-status-badge {
          background: #e6fffa;
          color: #2c7a7b;
        }

        .expand-icon {
          font-family: var(--font-mono);
          font-size: 16px;
          color: var(--voyage-text-soft);
        }

        .tool-details {
          padding: 12px;
          border-top: 1px solid var(--voyage-border);
          background: #fdfdfd;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .detail-block {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .detail-label {
          font-size: 9px;
          text-transform: uppercase;
          font-weight: 800;
          color: var(--voyage-text-soft);
        }

        .detail-json {
          font-family: var(--font-mono);
          font-size: 11px;
          background: #1e293b;
          color: #e2e8f0;
          padding: 10px;
          border-radius: 4px;
          margin: 0;
          overflow-x: auto;
          line-height: 1.4;
        }
      `}</style>
    </div>
  );
}
