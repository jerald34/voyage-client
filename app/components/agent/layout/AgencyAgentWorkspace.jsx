"use client";
import AgentThreadRail from './AgentThreadRail';

export default function AgencyAgentWorkspace({ children, chatPanel, liveWorkPanel, inspectorFooter }) {
  return (
    <div className="agency-agent-layout">
      {/* Left Rail */}
      <aside className="agent-sidebar">
        <AgentThreadRail />
      </aside>

      {/* Center Panel (Chat) */}
      <main className="agent-main">
        {chatPanel || children}
      </main>

      {/* Right Panel (Live Work / Itinerary) */}
      <aside className="agent-inspector">
        <div className="inspector-content">
          {liveWorkPanel}
        </div>
        {inspectorFooter && (
          <footer className="inspector-footer">
            {inspectorFooter}
          </footer>
        )}
      </aside>

      <style jsx global>{`
        .agency-agent-layout {
          display: grid;
          grid-template-columns: 260px 1fr 480px;
          height: 100vh;
          overflow: hidden;
          background: var(--voyage-background);
          color: var(--voyage-text);
          font-family: var(--font-sans, "Plus Jakarta Sans", sans-serif);
        }

        .agent-sidebar {
          border-right: 1px solid var(--voyage-border-strong);
          background: rgba(255, 255, 255, 0.4);
          backdrop-filter: blur(10px);
          overflow-y: auto;
        }

        .agent-main {
          display: flex;
          flex-direction: column;
          background: var(--voyage-surface);
          position: relative;
          overflow: hidden;
        }

        .agent-inspector {
          border-left: 1px solid var(--voyage-border-strong);
          background: rgba(255, 255, 255, 0.4);
          backdrop-filter: blur(10px);
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .inspector-content {
          flex-grow: 1;
          overflow-y: auto;
        }

        .inspector-footer {
          flex-shrink: 0;
        }

        @media (max-width: 1200px) {
          .agency-agent-layout {
            grid-template-columns: 240px 1fr 0px;
          }
          .agent-inspector {
            display: none;
          }
        }

        @media (max-width: 768px) {
          .agency-agent-layout {
            grid-template-columns: 1fr;
          }
          .agent-sidebar {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}
