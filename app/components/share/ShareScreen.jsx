export default function ShareScreen({ onBackToWorkspace }) {
  return (
    <section className="flex-1 flex items-start justify-center p-6">
      <div className="bg-surface/92 border border-border/12 rounded-lg shadow-strong backdrop-blur-[18px] p-6 w-full max-w-lg grid gap-5">
        <div>
          <span className="inline-flex items-center gap-2.5 text-secondary text-xs font-extrabold tracking-[0.18em] uppercase">
            <span className="w-11 h-px bg-current opacity-55" />
            Transmission
          </span>
          <h2 className="text-text-primary">Share your Voyage</h2>
          <p className="text-[1.08rem] text-text-muted mb-6">Project your itinerary to collaborators and devices.</p>
        </div>

        <div className="grid gap-3">
          <div className="p-4 bg-surface-elevated/80 border border-border/[0.12] rounded-md shadow-soft backdrop-blur-md flex flex-col gap-1">
            <strong className="text-sm font-bold text-text-primary">Direct Link</strong>
            <span className="text-sm text-text-soft">Generate a secure URL for mobile viewing.</span>
          </div>
          <div className="p-4 bg-surface-elevated/80 border border-border/[0.12] rounded-md shadow-soft backdrop-blur-md flex flex-col gap-1">
            <strong className="text-sm font-bold text-text-primary">Collaborator Access</strong>
            <span className="text-sm text-text-soft">Invite others to co-edit the itinerary.</span>
          </div>
          <div className="p-4 bg-surface-elevated/80 border border-border/[0.12] rounded-md shadow-soft backdrop-blur-md flex flex-col gap-1">
            <strong className="text-sm font-bold text-text-primary">PDF Export</strong>
            <span className="text-sm text-text-soft">Create a high-fidelity print snapshot.</span>
          </div>
        </div>

        <button className="inline-flex items-center justify-center gap-3 min-h-[54px] px-7 py-4 rounded-pill text-base font-extrabold cursor-pointer bg-secondary text-white shadow-strong hover:-translate-y-px transition-all mt-8 w-full" onClick={onBackToWorkspace}>
          Return to Workspace
        </button>
      </div>
    </section>
  );
}
