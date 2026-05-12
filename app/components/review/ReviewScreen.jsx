export default function ReviewScreen({ days, onBackToWorkspace, onShare, tripBrief }) {
  return (
    <section className="flex-1 flex items-start justify-center p-6">
      <div className="bg-surface/92 border border-border/12 rounded-lg shadow-strong backdrop-blur-[18px] p-6 w-full max-w-lg grid gap-5">
        <div>
          <span className="inline-flex items-center gap-2.5 text-secondary text-xs font-extrabold tracking-[0.18em] uppercase">
            <span className="w-11 h-px bg-current opacity-55" />
            Review
          </span>
          <h2>The Grand Tour</h2>
          <p className="text-[1.08rem] text-text-muted mb-6">Final check of your itinerary for {tripBrief.destination}.</p>
        </div>

        <div className="grid gap-3 mb-8">
          {days.map((day) => (
            <div key={day.id} className="p-4 bg-white/[0.92] border border-border/[0.12] rounded-md shadow-soft">
              <div className="flex justify-between items-center">
                <strong className="text-sm font-bold text-text-primary">
                  {day.label}: {day.title}
                </strong>
                <span className="text-[0.8rem] text-text-soft">
                  {(day.locations ?? []).length} stops
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-3.5 mt-8">
          <button className="inline-flex items-center justify-center gap-3 min-h-[54px] px-7 py-4 rounded-pill text-base font-extrabold cursor-pointer bg-white/75 text-text-primary border border-border/[0.18] hover:bg-accent/[0.08] hover:border-accent/[0.32] hover:-translate-y-px transition-all" onClick={onBackToWorkspace}>
            Adjust Plans
          </button>
          <button className="inline-flex items-center justify-center gap-3 min-h-[54px] px-7 py-4 rounded-pill text-base font-extrabold cursor-pointer bg-accent text-white shadow-[0_16px_32px_rgba(216,180,160,0.26)] hover:-translate-y-px hover:bg-[#dbbfae] transition-all" onClick={onShare}>
            Confirm Voyage
          </button>
        </div>
      </div>
    </section>
  );
}
