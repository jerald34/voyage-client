"use client";

export default function AgentTaskList({ tasks = [] }) {
  if (tasks.length === 0) return null;

  return (
    <div className="agent-task-list">
      <h3 className="section-title">Execution Steps</h3>
      <ul className="task-items">
        {tasks.map((task, index) => (
          <li key={index} className={`task-item ${task.status.toLowerCase()}`}>
            <span className="status-indicator"></span>
            <span className="task-label">{task.label}</span>
            <span className="task-status">{task.status}</span>
          </li>
        ))}
      </ul>

      <style jsx>{`
        .agent-task-list {
          padding: 16px;
          border-bottom: 1px solid var(--voyage-border);
        }

        .section-title {
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: var(--voyage-text-soft);
          font-weight: 800;
          margin-bottom: 12px;
        }

        .task-items {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .task-item {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 12px;
          color: var(--voyage-text-muted);
        }

        .status-indicator {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--voyage-border-strong);
        }

        .task-label {
          flex-grow: 1;
        }

        .task-status {
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          opacity: 0.6;
        }

        /* Status Colors */
        .task-item.running .status-indicator {
          background: var(--voyage-secondary);
          box-shadow: 0 0 8px var(--voyage-secondary);
          animation: pulse 1.5s infinite;
        }

        .task-item.completed .status-indicator {
          background: #2c7a7b;
        }

        .task-item.completed .task-label {
          text-decoration: line-through;
          opacity: 0.5;
        }

        @keyframes pulse {
          0% { opacity: 0.4; }
          50% { opacity: 1; }
          100% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}
