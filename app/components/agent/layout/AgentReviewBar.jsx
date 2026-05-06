"use client";

export default function AgentReviewBar({ onRevise, onEdit, onApprove }) {
  return (
    <div className="agent-review-bar">
      <div className="review-actions">
        <button className="review-btn secondary" onClick={onRevise}>
          Ask Agent to Revise
        </button>
        <button className="review-btn secondary" onClick={onEdit}>
          Edit Draft
        </button>
        <button className="review-btn primary" onClick={onApprove}>
          Mark Internally Reviewed
        </button>
        <button className="review-btn disabled" disabled title="Coming soon">
          Send to Client
        </button>
      </div>

      <style jsx>{`
        .agent-review-bar {
          padding: 16px 24px;
          background: white;
          border-top: 1px solid var(--voyage-border-strong);
        }

        .review-actions {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
        }

        .review-btn {
          padding: 8px 16px;
          border-radius: var(--voyage-radius-sm);
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
          border: 1px solid transparent;
        }

        .review-btn.primary {
          background: var(--voyage-primary);
          color: white;
        }

        .review-btn.secondary {
          background: white;
          border-color: var(--voyage-border-strong);
          color: var(--voyage-primary);
        }

        .review-btn.secondary:hover {
          background: var(--voyage-background);
        }

        .review-btn.disabled {
          background: #f1f5f9;
          color: #94a3b8;
          cursor: not-allowed;
          border-color: #e2e8f0;
        }
      `}</style>
    </div>
  );
}
