export default function AgentCommandCenter({ insights, onPrepareFollowUps, onRunReview }) {
  const safeInsights = Array.isArray(insights) ? insights : [];
  const canPrepareFollowUps = typeof onPrepareFollowUps === "function";

  return (
    <section className="agency-agent-panel frame-panel">
      <div className="agency-agent-copy">
        <span className="frame-label">Voyage Agent</span>
        <h1>Agent Command Center</h1>
        <p className="lede">
          The Agent scans active client trips, ranks the work that needs attention, and prepares the follow-ups your
          agency team should review today.
        </p>
      </div>

      <div className="agency-agent-actions">
        <div className="agency-agent-insights" aria-label="Agent portfolio insights">
          {safeInsights.map((insight) => (
            <span key={insight}>{insight}</span>
          ))}
        </div>
        <div className="agency-command-buttons">
          <button className="button button-primary" type="button" onClick={onRunReview}>
            Run Agency Review
          </button>
          <button
            className="button button-secondary"
            disabled={!canPrepareFollowUps}
            onClick={canPrepareFollowUps ? onPrepareFollowUps : undefined}
            title={
              canPrepareFollowUps
                ? undefined
                : "Prototype action pending: client follow-up preparation is not wired yet."
            }
            type="button"
          >
            Prepare today's client follow-ups
          </button>
        </div>
      </div>
    </section>
  );
}
