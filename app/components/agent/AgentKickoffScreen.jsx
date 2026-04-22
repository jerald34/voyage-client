export default function AgentKickoffScreen({ onOpenWorkspace, tripBrief }) {
  return (
    <section className="screen-frame">
      <div className="frame-panel agent-kickoff-layout">
        <div>
          <span className="frame-label">Agent Sync</span>
          <h2>Your copilot is ready.</h2>
          <p className="lede">
            The Voyage Agent has processed your brief for {tripBrief.destination}. We've mapped out potential clusters
            and optimized for your {tripBrief.pace} pace.
          </p>

          <button className="button button-primary" onClick={onOpenWorkspace} style={{ marginTop: "2rem" }}>
            Enter Workspace
          </button>
        </div>

        <div
          style={{
            background: "rgba(255,255,255,0.02)",
            padding: "24px",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--border-glass)",
          }}
        >
          <div className="detail-block">
            <p>Processing...</p>
            <ul>
              <li>Destination: {tripBrief.destination}</li>
              <li>Tempo: {tripBrief.pace}</li>
              <li>Priority: {tripBrief.priority}</li>
            </ul>
          </div>
          <div className="detail-block" style={{ marginBottom: 0 }}>
            <p>Module Status</p>
            <ul style={{ color: "var(--accent-secondary)" }}>
              <li>Itinerary Engine: OK</li>
              <li>Map Overlay: Ready</li>
              <li>Agent Memory: Initialized</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
