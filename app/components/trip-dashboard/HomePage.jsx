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
  const destination = tripBrief?.destination || "Active trip";

  return (
    <div className="landing-shell system-shell" style={{ paddingTop: "20px", maxWidth: "1220px", display: "grid", gap: "24px" }}>
      <header className="landing-header" style={{ position: "relative", marginBottom: 0, width: "100%" }}>
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
            <strong style={{ fontSize: "0.95rem", color: "var(--voyage-text)" }}>Traveler</strong>
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
            T
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

      <div style={{ display: "grid", gap: "24px", gridTemplateColumns: "minmax(280px, 0.9fr) minmax(0, 1.3fr)" }}>
        <MapOverviewPanel destination={destination} mapHighlights={mapHighlights} />
        <ItineraryTimeline days={days} onMarkDayDone={onMarkDayDone} onToggleLocation={onToggleLocation} />
      </div>
    </div>
  );
}
