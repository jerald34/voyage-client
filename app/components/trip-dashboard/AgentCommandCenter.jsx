import Link from "next/link";

export default function AgentCommandCenter({ agencyId, insights, onPrepareFollowUps, onRunReview }) {
  const safeInsights = Array.isArray(insights) ? insights : [];
  const canPrepareFollowUps = typeof onPrepareFollowUps === "function";
  const agentHref = agencyId ? `/agency/${agencyId}/agent` : '#';

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
          <Link href={agentHref} className="button button-primary" style={{ textDecoration: 'none' }}>
             Create Itinerary with Agent
          </Link>
          <button className="button button-secondary" type="button" onClick={onRunReview}>
            Run Agency Review
          </button>
        </div>
      </div>
    </section>
  );
}
