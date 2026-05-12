export default function AgentKickoffScreen({ onOpenWorkspace, tripBrief }) {
  return (
    <section className="flex items-center justify-center min-h-screen p-8 bg-background">
      <div className="bg-surface/92 border border-border/12 rounded-lg shadow-strong backdrop-blur-[18px] p-10 grid grid-cols-2 gap-10 max-w-4xl w-full">
        <div>
          <span className="inline-flex items-center gap-2.5 mb-5 text-secondary text-xs font-extrabold tracking-[0.18em] uppercase">
            Agent Sync
          </span>
          <h2>Your copilot is ready.</h2>
          <p className="text-[1.08rem] text-text-muted mb-6">
            The Voyage Agent has processed your brief for {tripBrief.destination}. We've mapped out potential clusters
            and optimized for your {tripBrief.pace} pace.
          </p>

          <button
            className="inline-flex items-center justify-center gap-2 min-h-[54px] px-7 py-4 rounded-pill font-extrabold bg-accent text-white shadow-[0_16px_32px_rgba(216,180,160,0.26)] hover:-translate-y-0.5 transition cursor-pointer mt-8"
            onClick={onOpenWorkspace}
          >
            Enter Workspace
          </button>
        </div>

        <div className="bg-white/[0.02] p-6 rounded-[18px] border border-[var(--border-glass)]">
          <div className="mb-5">
            <p className="text-sm font-bold text-text-muted mb-2">Processing...</p>
            <ul className="text-sm text-text-soft space-y-1 list-disc list-inside">
              <li>Destination: {tripBrief.destination}</li>
              <li>Tempo: {tripBrief.pace}</li>
              <li>Priority: {tripBrief.priority}</li>
            </ul>
          </div>
          <div>
            <p className="text-sm font-bold text-text-muted mb-2">Module Status</p>
            <ul className="text-sm text-secondary space-y-1 list-disc list-inside">
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
