"use client";

import DashboardHero from "./DashboardHero.jsx";
import TripSummaryStrip from "./TripSummaryStrip.jsx";
import MapOverviewPanel from "./MapOverviewPanel.jsx";
import ItineraryTimeline from "./ItineraryTimeline.jsx";

export default function HomePage({
  days,
  mapHighlights,
  nextActiveDay,
  onContinue,
  onMarkDayDone,
  onToggleLocation,
  tripBrief,
  tripProgress,
}) {
  return (
    <div className="trip-dashboard-shell">
      <header className="landing-header trip-dashboard-header">
        <a className="landing-brand" href="#home">
          Voyage
        </a>
        <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
          <div style={{ textAlign: "right", display: "flex", flexDirection: "column" }}>
            <span
              style={{
                fontSize: "0.78rem",
                color: "var(--voyage-text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                fontWeight: "700",
              }}
            >
              Active trip
            </span>
            <strong style={{ fontSize: "0.95rem", color: "var(--voyage-text)" }}>
              {tripBrief?.destination || "Traveler"}
            </strong>
          </div>
          <div
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "50%",
              background: "var(--voyage-accent)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontWeight: "bold",
              fontSize: "1.1rem",
              border: "2px solid rgba(255,255,255,0.8)",
              boxShadow: "var(--voyage-shadow-soft)",
            }}
          >
            V
          </div>
        </div>
      </header>

      <DashboardHero
        nextActiveDay={nextActiveDay}
        onContinue={onContinue}
        tripBrief={tripBrief}
        tripProgress={tripProgress}
      />

      <TripSummaryStrip nextActiveDay={nextActiveDay} tripBrief={tripBrief} tripProgress={tripProgress} />

      <div className="trip-dashboard-grid">
        <ItineraryTimeline days={days} onMarkDayDone={onMarkDayDone} onToggleLocation={onToggleLocation} />
        <MapOverviewPanel tripBrief={tripBrief} mapHighlights={mapHighlights} />
      </div>
    </div>
  );
}
