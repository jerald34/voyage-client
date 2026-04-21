"use client";

import { useState } from "react";
import prototypeData from "./prototype-data";
import { usePrototypeState } from "./prototype-state";

const workspaceTabs = [
  { id: "trip", label: "Trip" },
  { id: "map", label: "Map" },
  { id: "agent", label: "Agent" },
  { id: "share", label: "Share" },
];

const tripBriefLabels = {
  destination: "Destination",
  travelWindow: "Travel window",
  travelers: "Travelers",
  pace: "Pace",
  budget: "Budget",
  priority: "Planning priorities",
};

const landingNavItems = [
  { id: "home", label: "Home" },
  { id: "plan", label: "Plan" },
  { id: "how-it-works", label: "How It Works" },
  { id: "for-agencies", label: "For Agencies" },
  { id: "for-travelers", label: "For Travelers" },
  { id: "voyage-agent", label: "Voyage Agent" },
];

const featureHighlights = [
  {
    title: "Plan the trip",
    description: "Turn a rough travel idea into a structured itinerary brief with clear priorities and pace.",
  },
  {
    title: "See the route",
    description: "Keep planning tied to geography so timing, movement, and daily flow stay realistic.",
  },
  {
    title: "Refine with AI",
    description: "Use the Voyage agent to revise stops, rebalance days, and react faster to changes.",
  },
  {
    title: "Share the final itinerary",
    description: "Hand off the plan cleanly to clients, collaborators, or fellow travelers.",
  },
];

const workflowSteps = [
  {
    step: "01",
    title: "Brief the trip",
    description: "Capture destination, schedule, traveler count, pace, and priorities in one clear planning brief.",
  },
  {
    step: "02",
    title: "Build the itinerary",
    description: "Shape daily plans with structured stops instead of juggling notes, tabs, and spreadsheets.",
  },
  {
    step: "03",
    title: "Review on the map",
    description: "Keep route awareness visible so travel time and location clustering support better decisions.",
  },
  {
    step: "04",
    title: "Share and revise",
    description:
      "Update plans quickly when clients or travelers ask for changes, then send the latest version with confidence.",
  },
];

const audienceCards = [
  {
    id: "for-agencies",
    title: "For agencies and organizers",
    benefits: [
      "Reduce manual recalculation across multiple client itineraries.",
      "Keep planning, revision, and route awareness in one workspace.",
      "Move faster when clients request destination or schedule changes.",
    ],
  },
  {
    id: "for-travelers",
    title: "For individual travelers",
    benefits: [
      "Turn scattered trip ideas into a clear day-by-day plan.",
      "Balance stops, pace, and travel time with less context switching.",
      "Use Voyage as a travel copilot before the trip ever begins.",
    ],
  },
];

function formatTripBriefValue(key, value) {
  if (key === "travelers") return `${value} travelers`;
  return value;
}

function LandingPage({ onStart }) {
  return (
    <div className="landing-shell">
      <header className="landing-header">
        <a className="landing-brand" href="#home">
          Voyage
        </a>
        <nav className="landing-nav" aria-label="Landing page">
          {landingNavItems.map((item) => (
            <a key={item.id} href={`#${item.id}`}>
              {item.label}
            </a>
          ))}
        </nav>
        <button className="button button-primary landing-header-cta" onClick={onStart} type="button">
          Start Planning
        </button>
      </header>

      <section className="landing-hero" id="home">
        <div className="landing-hero-copy">
          <span className="frame-label">Unified travel planning</span>
          <h1>Plan smarter trips with AI, itinerary logic, and map-aware routing</h1>
          <p className="lede">
            Voyage brings together trip briefs, itinerary building, Google Maps-aware planning, and fast revisions in
            one workspace for travelers, agencies, and organizers.
          </p>
          <div className="button-stack">
            <button className="button button-primary" onClick={onStart} type="button">
              Start planning
            </button>
            <a className="button button-secondary" href="#how-it-works">
              See how Voyage works
            </a>
          </div>
        </div>

        <div className="landing-hero-panel" aria-label="Voyage product preview">
          <article className="preview-card preview-card-brief">
            <span className="frame-label">Trip brief</span>
            <h2>Turn direction into a clear planning brief</h2>
            <p>Capture destination, dates, pace, and planning priorities before the itinerary starts to take shape.</p>
          </article>
          <article className="preview-card preview-card-itinerary">
            <span className="frame-label">Itinerary</span>
            <h2>Shape daily flow with structured stops</h2>
            <p>Build day-by-day plans that stay readable, editable, and ready for collaboration.</p>
          </article>
          <article className="preview-card preview-card-map">
            <span className="frame-label">Google Maps</span>
            <h2>Keep route logic visible while planning</h2>
            <p>Review the trip geographically so timing, clustering, and movement stay grounded in the real route.</p>
          </article>
          <article className="preview-card preview-card-agent">
            <span className="frame-label">Voyage agent</span>
            <h2>Revise plans faster when priorities change</h2>
            <p>Use AI support to rebalance days, update stops, and respond quickly to new requests.</p>
          </article>
        </div>
      </section>

      <section className="landing-section" id="plan">
        <div className="section-heading">
          <span className="frame-label">Product overview</span>
          <h2>What is Voyage?</h2>
          <p className="lede">
            Voyage is a planning workspace that connects trip briefs, itinerary structure, route awareness, and AI
            revision tools so travel planning feels coordinated from the first draft to the final share.
          </p>
        </div>

        <div className="feature-grid">
          {featureHighlights.map((feature) => (
            <article key={feature.title} className="marketing-card">
              <span className="frame-label">{feature.title}</span>
              <p>{feature.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="landing-section" id="how-it-works">
        <div className="section-heading">
          <span className="frame-label">Workflow</span>
          <h2>How Voyage works</h2>
          <p className="lede">
            Move from a rough request to a map-aware itinerary in a four-step flow built for iteration instead of
            scattered planning tools.
          </p>
        </div>

        <div className="workflow-grid">
          {workflowSteps.map((step) => (
            <article key={step.step} className="workflow-card">
              <span className="frame-label">{step.step}</span>
              <h3>{step.title}</h3>
              <p>{step.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="landing-section">
        <div className="section-heading">
          <span className="frame-label">Audience</span>
          <h2>Built for every kind of planner</h2>
          <p className="lede">
            Whether you are coordinating client travel or mapping your own trip, Voyage keeps the planning logic in one
            place.
          </p>
        </div>

        <div className="audience-grid">
          {audienceCards.map((audience) => (
            <article key={audience.id} className="audience-card" id={audience.id}>
              <h3>{audience.title}</h3>
              <ul>
                {audience.benefits.map((benefit) => (
                  <li key={benefit}>{benefit}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className="landing-section" id="voyage-agent">
        <div className="frame-panel">
          <span className="frame-label">Voyage agent</span>
          <h2>Keep every revision connected to the plan</h2>
          <p className="lede">
            Voyage helps you revise with context, keep route awareness visible, and move from draft planning to a
            confident itinerary without restarting the workflow.
          </p>
          <div className="button-stack">
            <button className="button button-primary" onClick={onStart} type="button">
              Open the planner
            </button>
            <a className="button button-secondary" href="#plan">
              Review the product overview
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}

function EntryScreen({ email, onEmailChange, onGuest }) {
  return (
    <section className="screen-frame">
      <div className="frame-panel">
        <span className="frame-label">Identity</span>
        <h2>Continue your journey</h2>
        <p className="lede">Sign in to sync your itineraries across all your devices.</p>

        <div className="input-row">
          <span>Email address</span>
          <input
            type="email"
            value={email}
            onChange={(e) => onEmailChange(e.target.value)}
            placeholder="voyager@example.com"
          />
        </div>

        <div style={{ marginBottom: "2rem", fontSize: "0.8rem", color: "var(--text-dim)" }}>
          Social authentication (Google, Apple) will be available in the release version.
        </div>

        <button className="button button-primary" onClick={onGuest} style={{ width: "100%" }}>
          Continue as Guest
        </button>
      </div>
    </section>
  );
}

function TripBriefScreen({ onContinue, tripBrief }) {
  return (
    <section className="screen-frame">
      <div className="frame-panel">
        <span className="frame-label">Project Brief</span>
        <h2>Defining the scope</h2>
        <p className="lede">The foundation of every great Voyage starts with a clear brief.</p>

        <div className="field-grid">
          {Object.entries(tripBrief).map(([key, value]) => (
            <div key={key} className="input-row">
              <span>{tripBriefLabels[key] ?? key}</span>
              <strong>{formatTripBriefValue(key, value)}</strong>
            </div>
          ))}
        </div>

        <button className="button button-primary" onClick={onContinue} style={{ width: "100%" }}>
          Initialize Voyage Agent
        </button>
      </div>
    </section>
  );
}

function AgentKickoffScreen({ onOpenWorkspace, tripBrief }) {
  return (
    <section className="screen-frame">
      <div className="frame-panel" style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: "40px" }}>
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

function WorkspaceScreen({
  activeWorkspaceTab,
  agentMessages,
  days,
  onReviewTrip,
  onSelectDay,
  onSelectPlace,
  onTabChange,
  selectedDay,
  selectedDayId,
  selectedPlace,
  tripBrief,
}) {
  return (
    <section className="screen-frame screen-editor">
      <aside
        className="frame-panel frame-panel-nav"
        style={{ padding: "0", background: "transparent", border: "none", boxShadow: "none" }}
      >
        <div className="frame-panel" style={{ padding: "24px", marginBottom: "24px" }}>
          <span className="frame-label">Voyage</span>
          <h3 style={{ fontSize: "1.5rem" }}>{tripBrief.destination}</h3>
          <p style={{ fontSize: "0.8rem", color: "var(--text-dim)", marginTop: "8px" }}>{tripBrief.travelWindow}</p>
        </div>

        <div role="tablist" aria-label="Workspace sections" style={{ display: "grid", gap: "12px", marginBottom: "24px" }}>
          {workspaceTabs.map((tab) => (
            <button
              key={tab.id}
              className={`topbar-chip ${activeWorkspaceTab === tab.id ? "active" : ""}`}
              role="tab"
              aria-selected={activeWorkspaceTab === tab.id}
              onClick={() => onTabChange(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="frame-panel" style={{ padding: "24px" }}>
          <span className="frame-label">Timeline</span>
          <div style={{ marginTop: "16px" }}>
            {days.map((day) => (
              <button
                key={day.id}
                className={`day-pill ${selectedDayId === day.id ? "active" : ""}`}
                style={{ width: "100%", textAlign: "left" }}
                onClick={() => onSelectDay(day.id)}
              >
                <span>{day.label}</span>
                <strong style={{ fontSize: "0.9rem" }}>{day.title}</strong>
              </button>
            ))}
          </div>
        </div>
      </aside>

      <main className="frame-panel frame-panel-board">
        {activeWorkspaceTab === "trip" && (
          <div className="day-split">
            <div>
              <span className="frame-label">Voyage agent</span>
              <h3>{selectedDay?.title ?? "Planning Overview"}</h3>
              <p className="lede" style={{ marginBottom: "1rem" }}>
                Refine the rhythm of your days. Drag and drop stops to reorder.
              </p>
            </div>

            <div style={{ display: "grid", gap: "20px" }}>
              {days.map((day) => (
                <article
                  key={day.id}
                  className={`day-card ${selectedDayId === day.id ? "selected" : ""}`}
                  style={{ borderLeft: selectedDayId === day.id ? "4px solid var(--accent)" : "" }}
                >
                  <div className="day-card-head">
                    <div>
                      <span className="frame-label">{day.label}</span>
                      <strong style={{ fontSize: "1.3rem" }}>{day.title}</strong>
                    </div>
                    <button
                      className="button button-secondary"
                      style={{ padding: "8px 16px", fontSize: "0.8rem" }}
                      onClick={() => onSelectDay(day.id)}
                    >
                      {selectedDayId === day.id ? "Active" : "Focus"}
                    </button>
                  </div>

                  <div style={{ display: "grid", gap: "8px" }}>
                    {day.stops.map((stop) => (
                      <div key={stop} className="activity-chip">
                        <span className="chip-drag"></span>
                        <span style={{ fontSize: "0.95rem" }}>{stop}</span>
                      </div>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}

        {activeWorkspaceTab === "map" && (
          <div className="day-split">
            <div>
              <span className="frame-label">Spatial Planning</span>
              <h3>Map Discovery</h3>
              <p className="lede">Anchors and potential stops clustered for efficiency.</p>
            </div>

            <div className="day-card" style={{ background: "var(--accent-glow)", borderColor: "var(--accent)" }}>
              <span className="frame-label" style={{ color: "var(--text-main)" }}>
                Selected place
              </span>
              <h4 style={{ fontSize: "1.2rem", marginBottom: "8px" }}>
                {selectedPlace?.name ?? "Select a point on the map"}
              </h4>
              <p style={{ color: "var(--text-main)", opacity: 0.8 }}>{selectedPlace?.note}</p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "16px" }}>
              {prototypeData.mapPlaces.map((place) => (
                <button
                  key={place.id}
                  className={`day-card ${selectedPlace?.id === place.id ? "selected" : ""}`}
                  style={{ textAlign: "left", cursor: "pointer" }}
                  onClick={() => onSelectPlace(place.id)}
                >
                  <span style={{ fontSize: "0.7rem", color: "var(--accent)" }}>{place.district}</span>
                  <strong style={{ display: "block", fontSize: "1rem", marginTop: "4px" }}>{place.name}</strong>
                </button>
              ))}
            </div>
          </div>
        )}

        {activeWorkspaceTab === "agent" && (
          <div className="day-split">
            <div>
              <span className="frame-label">Voyage agent</span>
              <h3>Voyage Agent</h3>
              <p className="lede">Conversational refinement for your itinerary.</p>
            </div>

            <div style={{ display: "grid", gap: "16px" }}>
              {agentMessages.map((msg) => (
                <div
                  key={msg.id}
                  className="share-row"
                  style={{ borderLeft: msg.role === "assistant" ? "2px solid var(--accent)" : "2px solid var(--text-dim)" }}
                >
                  <strong>{msg.role === "assistant" ? "Voyage Agent" : "You"}</strong>
                  <p>{msg.text}</p>
                </div>
              ))}
            </div>

            <div className="input-row" style={{ marginTop: "20px" }}>
              <input
                type="text"
                placeholder="Ask about reservations, clusters, or pace..."
                style={{
                  background: "var(--bg-glass)",
                  border: "1px solid var(--border-glass)",
                  borderRadius: "var(--radius-md)",
                  padding: "16px",
                  color: "#fff",
                  width: "100%",
                }}
              />
            </div>
          </div>
        )}

        {activeWorkspaceTab === "share" && (
          <div className="day-split">
            <div>
              <span className="frame-label">Deployment</span>
              <h3>Trip Finalization</h3>
              <p className="lede">Exporting your plans to high-fidelity formats.</p>
            </div>
            <div className="day-card">
              <p>Ready to deploy your itinerary for {tripBrief.destination}.</p>
              <button className="button button-primary" style={{ marginTop: "16px" }} onClick={onReviewTrip}>
                Review & Export
              </button>
            </div>
          </div>
        )}
      </main>

      <aside className="frame-panel frame-panel-detail">
        <span className="frame-label">Quick Insights</span>

        <div className="detail-block">
          <p>Context</p>
          <strong style={{ fontSize: "1rem", marginBottom: "8px", display: "block" }}>{tripBrief.destination}</strong>
          <ul style={{ fontSize: "0.85rem" }}>
            <li>{tripBrief.travelers} Travelers</li>
            <li>{tripBrief.pace}</li>
            <li>Budget: {tripBrief.budget}</li>
          </ul>
        </div>

        {selectedDay && (
          <div className="detail-block">
            <p>Active Day: {selectedDay.label}</p>
            <strong style={{ fontSize: "1rem", marginBottom: "8px", display: "block" }}>{selectedDay.title}</strong>
            <ul>
              {selectedDay.stops.map((stop) => (
                <li key={stop}>{stop}</li>
              ))}
            </ul>
          </div>
        )}

        <div style={{ marginTop: "auto" }}>
          <button className="button button-primary" style={{ width: "100%" }} onClick={onReviewTrip}>
            Final Review
          </button>
        </div>
      </aside>
    </section>
  );
}

function ReviewScreen({ days, onBackToWorkspace, onShare, tripBrief }) {
  return (
    <section className="screen-frame">
      <div className="frame-panel">
        <span className="frame-label">Review</span>
        <h2>The Grand Tour</h2>
        <p className="lede">Final check of your itinerary for {tripBrief.destination}.</p>

        <div style={{ display: "grid", gap: "12px", marginBottom: "32px" }}>
          {days.map((day) => (
            <div key={day.id} className="day-card" style={{ padding: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <strong>
                  {day.label}: {day.title}
                </strong>
                <span style={{ fontSize: "0.8rem", color: "var(--text-dim)" }}>{day.stops.length} stops</span>
              </div>
            </div>
          ))}
        </div>

        <div className="button-stack">
          <button className="button button-secondary" onClick={onBackToWorkspace}>
            Adjust Plans
          </button>
          <button className="button button-primary" onClick={onShare}>
            Confirm Voyage
          </button>
        </div>
      </div>
    </section>
  );
}

function ShareScreen({ onBackToWorkspace }) {
  return (
    <section className="screen-frame">
      <div className="frame-panel">
        <span className="frame-label">Transmission</span>
        <h2>Share your Voyage</h2>
        <p className="lede">Project your itinerary to collaborators and devices.</p>

        <div className="share-list">
          <div className="share-row">
            <strong>Direct Link</strong>
            <span>Generate a secure URL for mobile viewing.</span>
          </div>
          <div className="share-row">
            <strong>Collaborator Access</strong>
            <span>Invite others to co-edit the itinerary.</span>
          </div>
          <div className="share-row">
            <strong>PDF Export</strong>
            <span>Create a high-fidelity print snapshot.</span>
          </div>
        </div>

        <button className="button button-primary" onClick={onBackToWorkspace} style={{ marginTop: "32px", width: "100%" }}>
          Return to Workspace
        </button>
      </div>
    </section>
  );
}

export default function HomePage() {
  const {
    activeScreen,
    setActiveScreen,
    activeWorkspaceTab,
    setActiveWorkspaceTab,
    tripBrief,
    days,
    selectedDayId,
    setSelectedDayId,
    selectedPlaceId,
    setSelectedPlaceId,
    agentMessages,
  } = usePrototypeState();

  const currentScreen = activeScreen === "landing" ? "welcome" : activeScreen;
  const currentWorkspaceTab =
    activeWorkspaceTab === "overview" || activeWorkspaceTab === "itinerary" ? "trip" : activeWorkspaceTab;

  const selectedDay = days.find((day) => day.id === selectedDayId) || days[0];
  const selectedPlace = prototypeData.mapPlaces.find((place) => place.id === selectedPlaceId) || prototypeData.mapPlaces[0];

  const [email, setEmail] = useState("");

  return (
    <main className="system-shell">
      <div className="system-grain" aria-hidden="true" />

      <section className="wireframe-section">
        {currentScreen === "welcome" && <LandingPage onStart={() => setActiveScreen("entry")} />}

        {currentScreen === "entry" && (
          <EntryScreen email={email} onEmailChange={setEmail} onGuest={() => setActiveScreen("trip-brief")} />
        )}

        {currentScreen === "trip-brief" && (
          <TripBriefScreen onContinue={() => setActiveScreen("agent-kickoff")} tripBrief={tripBrief} />
        )}

        {currentScreen === "agent-kickoff" && (
          <AgentKickoffScreen onOpenWorkspace={() => setActiveScreen("workspace")} tripBrief={tripBrief} />
        )}

        {currentScreen === "workspace" && (
          <WorkspaceScreen
            activeWorkspaceTab={currentWorkspaceTab}
            agentMessages={agentMessages}
            days={days}
            onReviewTrip={() => setActiveScreen("review")}
            onSelectDay={setSelectedDayId}
            onSelectPlace={setSelectedPlaceId}
            onTabChange={(tab) => {
              setActiveWorkspaceTab(tab);
              if (tab === "map" && !selectedPlaceId) setSelectedPlaceId(prototypeData.mapPlaces[0].id);
            }}
            selectedDay={selectedDay}
            selectedDayId={selectedDayId}
            selectedPlace={selectedPlace}
            tripBrief={tripBrief}
          />
        )}

        {currentScreen === "review" && (
          <ReviewScreen
            days={days}
            onBackToWorkspace={() => setActiveScreen("workspace")}
            onShare={() => setActiveScreen("share")}
            tripBrief={tripBrief}
          />
        )}

        {currentScreen === "share" && <ShareScreen onBackToWorkspace={() => setActiveScreen("workspace")} />}
      </section>
    </main>
  );
}
