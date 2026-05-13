const workspaceTabs = [
  { id: "trip", label: "Trip" },
  { id: "map", label: "Map" },
  { id: "agent", label: "Agent" },
  { id: "share", label: "Share" },
];

/* 6-dot grip icon (2x3 grid) used as a drag-handle hint */
function GripDots() {
  return (
    <svg width="10" height="14" viewBox="0 0 10 14" fill="currentColor" className="text-text-soft/50 shrink-0">
      <circle cx="2" cy="2" r="1.5" />
      <circle cx="8" cy="2" r="1.5" />
      <circle cx="2" cy="7" r="1.5" />
      <circle cx="8" cy="7" r="1.5" />
      <circle cx="2" cy="12" r="1.5" />
      <circle cx="8" cy="12" r="1.5" />
    </svg>
  );
}

export default function WorkspaceScreen({
  activeWorkspaceTab,
  agentMessages,
  days,
  mapPlaces,
  onReviewTrip,
  onSelectDay,
  onSelectPlace,
  onTabChange,
  selectedDay,
  selectedDayId,
  selectedPlace,
  tripBrief,
}) {
  const safeMapPlaces = Array.isArray(mapPlaces) ? mapPlaces : [];

  return (
    <section className="grid grid-cols-1 md:grid-cols-[1fr] lg:grid-cols-[288px_1fr_288px] gap-5 items-start animate-[fade-in_0.55s_ease]">

      {/* ───────────── LEFT SIDEBAR ───────────── */}
      <aside className="bg-surface rounded-lg shadow-soft p-5 flex flex-col gap-5 md:flex-row md:flex-wrap md:items-start lg:flex-col lg:flex-nowrap">

        {/* Trip header */}
        <div className="flex-1 min-w-0">
          <p className="text-secondary text-xs font-extrabold tracking-[0.18em] uppercase mb-1">Voyage</p>
          <h3 className="font-serif text-xl text-text-primary leading-tight">{tripBrief.destination}</h3>
          <p className="text-text-muted text-xs mt-2">{tripBrief.travelWindow}</p>
          {tripBrief.travelers && (
            <p className="text-text-soft text-xs mt-1">{tripBrief.travelers} travelers</p>
          )}
        </div>

        {/* Day pills */}
        <div className="w-full">
          <p className="text-text-soft text-xs font-bold uppercase tracking-wider mb-3">Timeline</p>
          <div className="flex flex-row overflow-x-auto gap-2 pb-2 lg:flex-col lg:overflow-x-visible lg:pb-0 scrollbar-none">
            {days.map((day) => (
              <button
                key={day.id}
                className={`
                  w-40 shrink-0 lg:w-full rounded-md p-3 border cursor-pointer
                  text-left transition-all duration-150 hover:-translate-y-0.5
                  ${
                    selectedDayId === day.id
                      ? "bg-secondary/10 border-secondary/30 text-text-primary"
                      : "bg-transparent border-border/12 text-text-muted hover:border-border/25"
                  }
                `}
                onClick={() => onSelectDay(day.id)}
              >
                <span className="block text-secondary text-[0.68rem] font-extrabold uppercase tracking-[0.12em] mb-0.5">
                  {day.label}
                </span>
                <strong className="block text-sm font-bold">{day.title}</strong>
              </button>
            ))}
          </div>
        </div>
      </aside>

      {/* ───────────── MAIN PANEL ───────────── */}
      <main className="min-w-0">

        {/* Tab navigation */}
        <div role="tablist" aria-label="Workspace sections" className="flex gap-2 mb-4 overflow-x-auto scrollbar-none">
          {workspaceTabs.map((tab) => (
            <button
              key={tab.id}
              className={`
                px-4 py-2 rounded-pill font-bold text-sm whitespace-nowrap transition-all duration-150
                ${
                  activeWorkspaceTab === tab.id
                    ? "bg-secondary text-white shadow-soft"
                    : "bg-surface border border-border/12 text-text-muted hover:bg-border/8"
                }
              `}
              role="tab"
              aria-selected={activeWorkspaceTab === tab.id}
              onClick={() => onTabChange(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ─── Trip Tab ─── */}
        {activeWorkspaceTab === "trip" && (
          <div className="flex flex-col gap-4">
            <div>
              <p className="text-secondary text-xs font-extrabold tracking-[0.18em] uppercase mb-2">Itinerary</p>
              <h3 className="font-serif text-xl text-text-primary leading-tight">
                {selectedDay?.title ?? "Planning Overview"}
              </h3>
              <p className="text-text-muted text-sm mt-1">
                Refine the rhythm of your days. Drag and drop stops to reorder.
              </p>
            </div>

            <div className="flex flex-col gap-4">
              {days.map((day) => (
                <article
                  key={day.id}
                  className={`
                    bg-surface rounded-md shadow-soft p-4 border transition-colors duration-150
                    ${
                      selectedDayId === day.id
                        ? "border-secondary/30 border-l-4 border-l-secondary"
                        : "border-border/8"
                    }
                  `}
                >
                  {/* Day card header */}
                  <div className="flex justify-between gap-4 items-start mb-3 flex-wrap">
                    <div>
                      <span className="block text-secondary text-[0.68rem] font-extrabold uppercase tracking-[0.12em] mb-0.5">
                        {day.label}
                      </span>
                      <strong className="block text-lg font-bold text-text-primary">{day.title}</strong>
                    </div>
                    <button
                      className={`
                        px-3 py-1.5 rounded-pill text-xs font-bold border transition-all duration-150
                        ${
                          selectedDayId === day.id
                            ? "bg-secondary/10 border-secondary/30 text-secondary"
                            : "bg-surface border-border/12 text-text-muted hover:bg-border/8"
                        }
                      `}
                      onClick={() => onSelectDay(day.id)}
                    >
                      {selectedDayId === day.id ? "Active" : "Focus"}
                    </button>
                  </div>

                  {/* Location rows */}
                  <div className="flex flex-col gap-2">
                    {(day.locations ?? []).map((location) => (
                      <div
                        key={location.id}
                        className="flex items-center gap-3 p-3 rounded-sm bg-surface/60 border border-border/8"
                      >
                        <GripDots />
                        <span className="text-sm text-text-primary">{location.name}</span>
                      </div>
                    ))}
                  </div>

                  {/* Add location button */}
                  <button className="mt-3 w-full py-2 rounded-sm border border-dashed border-border/20 text-text-soft text-xs font-bold hover:border-secondary/30 hover:text-secondary transition-colors duration-150">
                    + Add location
                  </button>
                </article>
              ))}
            </div>
          </div>
        )}

        {/* ─── Map Tab ─── */}
        {activeWorkspaceTab === "map" && (
          <div className="flex flex-col gap-4">
            <div>
              <p className="text-secondary text-xs font-extrabold tracking-[0.18em] uppercase mb-2">Spatial Planning</p>
              <h3 className="font-serif text-xl text-text-primary leading-tight">Map Discovery</h3>
              <p className="text-text-muted text-sm mt-1">
                Anchors and potential stops clustered for efficiency.
              </p>
            </div>

            {/* Selected place highlight */}
            <div className="bg-accent/10 border border-accent/30 rounded-md p-4">
              <p className="text-text-muted text-xs font-bold uppercase tracking-wider mb-1">Selected place</p>
              <h4 className="font-serif text-lg text-text-primary mb-1">
                {selectedPlace?.name ?? "Select a point on the map"}
              </h4>
              {selectedPlace?.note && (
                <p className="text-text-muted text-sm">{selectedPlace.note}</p>
              )}
            </div>

            {/* Map placeholder */}
            <div className="h-96 bg-background rounded-md flex items-center justify-center">
              <p className="text-text-soft text-sm">Map loads when locations are added</p>
            </div>

            {/* Place cards grid */}
            {safeMapPlaces.length > 0 && (
              <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-3">
                {safeMapPlaces.map((place) => (
                  <button
                    key={place.id}
                    className={`
                      text-left rounded-md p-4 border transition-all duration-150 cursor-pointer
                      hover:shadow-soft hover:-translate-y-0.5
                      ${
                        selectedPlace?.id === place.id
                          ? "bg-secondary/8 border-secondary/30"
                          : "bg-surface border-border/8"
                      }
                    `}
                    onClick={() => onSelectPlace(place.id)}
                  >
                    <span className="block text-accent text-[0.7rem] font-extrabold uppercase tracking-wider">
                      {place.district}
                    </span>
                    <strong className="block text-sm text-text-primary mt-1">{place.name}</strong>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ─── Agent Tab ─── */}
        {activeWorkspaceTab === "agent" && (
          <div className="flex flex-col gap-4">
            <div>
              <p className="text-secondary text-xs font-extrabold tracking-[0.18em] uppercase mb-2">Voyage Agent</p>
              <h3 className="font-serif text-xl text-text-primary leading-tight">Voyage Agent</h3>
              <p className="text-text-muted text-sm mt-1">
                Conversational refinement for your itinerary.
              </p>
            </div>

            {/* Messages list */}
            <div className="flex flex-col gap-3 max-h-[480px] overflow-y-auto pr-1">
              {agentMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`
                    max-w-[85%] rounded-md px-4 py-2
                    ${
                      msg.role === "assistant"
                        ? "self-start bg-surface border border-border/12 text-text-primary"
                        : "self-end bg-secondary text-white"
                    }
                  `}
                >
                  <strong className="block text-xs font-bold mb-0.5 opacity-70">
                    {msg.role === "assistant" ? "Voyage Agent" : "You"}
                  </strong>
                  <p className="text-sm">{msg.text}</p>
                </div>
              ))}
            </div>

            {/* Input at bottom */}
            <div className="flex gap-2 mt-2">
              <textarea
                placeholder="Ask about reservations, clusters, or pace..."
                rows={1}
                className="flex-1 bg-surface border border-border/12 rounded-md px-4 py-3 text-sm text-text-primary placeholder:text-text-soft resize-none focus:outline-none focus:ring-2 focus:ring-secondary/30 transition"
              />
              <button className="shrink-0 bg-secondary text-white rounded-md px-4 py-3 text-sm font-bold hover:bg-secondary/90 transition-colors duration-150">
                Send
              </button>
            </div>
          </div>
        )}

        {/* ─── Share Tab ─── */}
        {activeWorkspaceTab === "share" && (
          <div className="flex flex-col gap-4">
            <div>
              <p className="text-secondary text-xs font-extrabold tracking-[0.18em] uppercase mb-2">Deployment</p>
              <h3 className="font-serif text-xl text-text-primary leading-tight">Trip Finalization</h3>
              <p className="text-text-muted text-sm mt-1">
                Export and share your plans for {tripBrief.destination}.
              </p>
            </div>

            {/* Share option cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Copy Link */}
              <div className="bg-surface rounded-md p-4 border border-border/12 hover:shadow-soft cursor-pointer transition-all duration-150 group">
                <div className="w-10 h-10 rounded-sm bg-secondary/10 flex items-center justify-center mb-3 group-hover:bg-secondary/20 transition-colors">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-secondary">
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                  </svg>
                </div>
                <h4 className="text-sm font-bold text-text-primary mb-1">Copy Link</h4>
                <p className="text-xs text-text-muted">Share a direct link to your itinerary with anyone.</p>
              </div>

              {/* Generate QR */}
              <div className="bg-surface rounded-md p-4 border border-border/12 hover:shadow-soft cursor-pointer transition-all duration-150 group">
                <div className="w-10 h-10 rounded-sm bg-secondary/10 flex items-center justify-center mb-3 group-hover:bg-secondary/20 transition-colors">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-secondary">
                    <rect x="2" y="2" width="8" height="8" rx="1" />
                    <rect x="14" y="2" width="8" height="8" rx="1" />
                    <rect x="2" y="14" width="8" height="8" rx="1" />
                    <rect x="14" y="14" width="4" height="4" rx="0.5" />
                    <path d="M22 14h-4v4" />
                    <path d="M22 22h-4v-4" />
                  </svg>
                </div>
                <h4 className="text-sm font-bold text-text-primary mb-1">Generate QR</h4>
                <p className="text-xs text-text-muted">Create a QR code for quick mobile access.</p>
              </div>

              {/* Export PDF */}
              <div
                className="bg-surface rounded-md p-4 border border-border/12 hover:shadow-soft cursor-pointer transition-all duration-150 group"
                onClick={onReviewTrip}
              >
                <div className="w-10 h-10 rounded-sm bg-secondary/10 flex items-center justify-center mb-3 group-hover:bg-secondary/20 transition-colors">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-secondary">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="12" y1="18" x2="12" y2="12" />
                    <polyline points="9 15 12 18 15 15" />
                  </svg>
                </div>
                <h4 className="text-sm font-bold text-text-primary mb-1">Export PDF</h4>
                <p className="text-xs text-text-muted">Download a polished PDF of your complete trip.</p>
              </div>
            </div>

            {/* Review CTA */}
            <button
              className="w-full bg-secondary text-white rounded-pill py-3.5 font-extrabold text-sm shadow-soft hover:-translate-y-0.5 transition-all duration-150 mt-2"
              onClick={onReviewTrip}
            >
              Review & Export
            </button>
          </div>
        )}
      </main>

      {/* ───────────── RIGHT PANEL ───────────── */}
      <aside className="hidden lg:flex flex-col bg-surface rounded-lg shadow-soft p-5 gap-5">

        {/* Quick Insights heading */}
        <p className="font-bold text-sm text-text-soft uppercase tracking-wider">Quick Insights</p>

        {/* Trip context stats */}
        <div className="flex flex-col gap-3">
          <div className="bg-background/60 rounded-sm p-3 border border-border/8">
            <p className="text-text-soft text-[0.68rem] font-bold uppercase tracking-wider mb-1">Destination</p>
            <strong className="block text-sm text-text-primary">{tripBrief.destination}</strong>
          </div>
          <div className="bg-background/60 rounded-sm p-3 border border-border/8">
            <p className="text-text-soft text-[0.68rem] font-bold uppercase tracking-wider mb-1">Travelers</p>
            <strong className="block text-sm text-text-primary">{tripBrief.travelers}</strong>
          </div>
          <div className="bg-background/60 rounded-sm p-3 border border-border/8">
            <p className="text-text-soft text-[0.68rem] font-bold uppercase tracking-wider mb-1">Pace</p>
            <strong className="block text-sm text-text-primary">{tripBrief.pace}</strong>
          </div>
          <div className="bg-background/60 rounded-sm p-3 border border-border/8">
            <p className="text-text-soft text-[0.68rem] font-bold uppercase tracking-wider mb-1">Budget</p>
            <strong className="block text-sm text-text-primary">{tripBrief.budget}</strong>
          </div>
        </div>

        {/* Active Day detail */}
        {selectedDay && (
          <div>
            <p className="font-bold text-sm text-text-soft uppercase tracking-wider mb-3">Active Day</p>
            <div className="bg-secondary/5 rounded-sm p-3 border border-secondary/15">
              <span className="block text-secondary text-[0.68rem] font-extrabold uppercase tracking-[0.12em] mb-0.5">
                {selectedDay.label}
              </span>
              <strong className="block text-sm text-text-primary mb-2">{selectedDay.title}</strong>
              <ul className="flex flex-col gap-1.5">
                {(selectedDay.locations ?? []).map((location) => (
                  <li key={location.id} className="flex items-center gap-2 text-xs text-text-muted">
                    <span className="w-1.5 h-1.5 rounded-full bg-secondary/50 shrink-0" />
                    {location.name}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Recent Activity */}
        <div>
          <p className="font-bold text-sm text-text-soft uppercase tracking-wider mb-3">Recent Activity</p>
          <div className="flex flex-col gap-2">
            <div className="flex items-start gap-2 text-xs text-text-muted">
              <span className="w-1.5 h-1.5 mt-1 rounded-full bg-accent/60 shrink-0" />
              Trip brief created
            </div>
            <div className="flex items-start gap-2 text-xs text-text-muted">
              <span className="w-1.5 h-1.5 mt-1 rounded-full bg-accent/60 shrink-0" />
              Itinerary generated
            </div>
            <div className="flex items-start gap-2 text-xs text-text-muted">
              <span className="w-1.5 h-1.5 mt-1 rounded-full bg-accent/60 shrink-0" />
              {days.length} days planned
            </div>
          </div>
        </div>

        {/* Final Review CTA */}
        <div className="mt-auto">
          <button
            className="w-full bg-secondary text-white rounded-pill py-3 font-extrabold text-sm shadow-soft hover:-translate-y-0.5 transition-all duration-150"
            onClick={onReviewTrip}
          >
            Final Review
          </button>
        </div>
      </aside>
    </section>
  );
}
