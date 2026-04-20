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

const fieldInputStyle = {
  width: "100%",
  marginTop: "10px",
  padding: "14px 16px",
  borderRadius: "16px",
  border: "1px solid rgba(247, 243, 235, 0.15)",
  background: "rgba(255, 255, 255, 0.04)",
  color: "inherit",
  font: "inherit",
};

const workspaceTabListStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
  gap: "10px",
};

const workspaceTabStyle = {
  appearance: "none",
  minHeight: "46px",
  padding: "0 14px",
  borderRadius: "999px",
  border: "1px solid rgba(247, 243, 235, 0.18)",
  background: "rgba(255, 255, 255, 0.03)",
  color: "inherit",
  font: "inherit",
  fontWeight: 700,
  cursor: "pointer",
};

function formatTripBriefValue(key, value) {
  if (key === "travelers") {
    return `${value} travelers`;
  }

  return value;
}

function getWorkspaceTab(activeWorkspaceTab) {
  if (activeWorkspaceTab === "overview" || activeWorkspaceTab === "itinerary") {
    return "trip";
  }

  return activeWorkspaceTab;
}

function getSelectedPlace(selectedPlaceId) {
  return (
    prototypeData.mapPlaces.find((place) => place.id === selectedPlaceId) ??
    prototypeData.mapPlaces[0] ??
    null
  );
}

function getSelectedDay(days, selectedDayId) {
  return days.find((day) => day.id === selectedDayId) ?? days[0] ?? null;
}

function openWorkspace({
  setActiveScreen,
  setActiveWorkspaceTab,
  setSelectedPlaceId,
}) {
  setActiveWorkspaceTab("trip");
  setSelectedPlaceId(prototypeData.mapPlaces[0]?.id ?? null);
  setActiveScreen("workspace");
}

function changeWorkspaceTab({
  nextTab,
  selectedPlaceId,
  setActiveWorkspaceTab,
  setSelectedPlaceId,
}) {
  setActiveWorkspaceTab(nextTab);

  if (nextTab === "map" && !selectedPlaceId) {
    setSelectedPlaceId(prototypeData.mapPlaces[0]?.id ?? null);
  }
}

function selectDay({
  dayId,
  setActiveWorkspaceTab,
  setSelectedDayId,
}) {
  setSelectedDayId(dayId);
  setActiveWorkspaceTab("trip");
}

function WelcomeScreen({ installRequested, onInstall, onStart }) {
  const [startAction, installAction] = prototypeData.entryActions;

  return (
    <section className="screen-frame">
      <div className="frame-panel frame-panel-form">
        <div className="frame-header">
          <p className="frame-label">PWA welcome</p>
          <h1>Plan the route before you leave home.</h1>
          <p>
            Voyage opens with the feel of a well-marked departure board: destination first,
            decisions next, and just enough structure to turn a loose idea into a trip worth taking.
          </p>
        </div>

        <div className="button-stack">
          <button className="button button-primary" onClick={onStart} type="button">
            {startAction.label}
          </button>
          <button className="button button-secondary" onClick={onInstall} type="button">
            {installAction.label}
          </button>
        </div>

        {installRequested && (
          <p role="status">
            Install stays staged as a PWA touchpoint here so the planning flow still feels ready
            for the traveler&apos;s phone.
          </p>
        )}
      </div>
    </section>
  );
}

function EntryScreen({ email, onEmailChange, onGuest }) {
  return (
    <section className="screen-frame">
      <div className="frame-panel frame-panel-form">
        <div className="frame-header">
          <p className="frame-label">Entry</p>
          <h2>Continue into planning</h2>
          <p>
            Step through the lightest door available, then move straight into the brief while the
            trip still feels fresh.
          </p>
        </div>

        <label className="input-row">
          <span>Email address</span>
          <input
            aria-label="Email address"
            onChange={(event) => onEmailChange(event.target.value)}
            placeholder="name@example.com"
            style={fieldInputStyle}
            type="email"
            value={email}
          />
        </label>

        <div className="input-row">
          <span>Sign-in paths sketched for later</span>
          <strong>Email, Google, and Apple will be wired in after the guest flow.</strong>
        </div>

        <div className="button-stack">
          <button className="button button-primary" onClick={onGuest} type="button">
            Continue as guest
          </button>
        </div>
      </div>
    </section>
  );
}

function TripBriefScreen({ onContinue, tripBrief }) {
  return (
    <section className="screen-frame">
      <div className="frame-panel frame-panel-form">
        <div className="frame-header">
          <p className="frame-label">Trip brief</p>
          <h2>Build your trip brief</h2>
          <p>
            Give Voyage the bones of the journey: where you&apos;re headed, who&apos;s coming, how
            the days should feel, and what deserves priority once the itinerary starts to take shape.
          </p>
        </div>

        <div className="field-grid">
          {Object.entries(tripBrief).map(([key, value], index) => (
            <article
              key={key}
              className={`input-row input-row-${index % 2 === 0 ? "wide" : "compact"}`}
            >
              <span>{tripBriefLabels[key] ?? key}</span>
              <strong>{formatTripBriefValue(key, value)}</strong>
            </article>
          ))}
        </div>

        <div className="step-footer">
          <div className="footer-actions">
            <button className="button button-primary" onClick={onContinue} type="button">
              Continue to Voyage agent
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function AgentKickoffScreen({ onOpenWorkspace, tripBrief }) {
  return (
    <section className="screen-frame screen-create">
      <div className="frame-panel frame-panel-form">
        <div className="frame-header">
          <p className="frame-label">Agent kickoff</p>
          <h2>Bring in Voyage agent as your planning copilot</h2>
          <p>
            The brief is in place. Now the copilot can start shaping it into a trip that reads like
            an editorial itinerary: clear days, smart clusters, and a steady sense of where to go
            next.
          </p>
        </div>

        <div className="input-row input-row-wide">
          <span>Voyage agent</span>
          <strong>
            Ready to turn {tripBrief.destination} into a paced plan with route notes, food
            anchors, and room for unplanned hours.
          </strong>
        </div>

        <div className="step-footer">
          <span>Planning copilot queued from the trip brief</span>
          <div className="footer-actions">
            <button className="button button-primary" onClick={onOpenWorkspace} type="button">
              Open workspace
            </button>
          </div>
        </div>
      </div>

      <div className="frame-panel frame-panel-detail">
        <div className="detail-block">
          <p>What the copilot carries in</p>
          <ul>
            <li>{tripBrief.travelWindow}</li>
            <li>{tripBrief.pace}</li>
            <li>{tripBrief.priority}</li>
          </ul>
        </div>

        <div className="detail-block">
          <p>Next in the workspace</p>
          <ul>
            <li>Trip tab for day-by-day pacing</li>
            <li>Map tab for place selection and clustering</li>
            <li>Agent tab for planning prompts that stay close to the itinerary</li>
          </ul>
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
      <aside className="frame-panel frame-panel-nav">
        <div className="frame-header">
          <p className="frame-label">Workspace</p>
          <h3>{tripBrief.destination}</h3>
          <p>Itinerary-first planning with the map and agent close enough to steer every day.</p>
        </div>

        <div aria-label="Workspace tabs" role="tablist" style={workspaceTabListStyle}>
          {workspaceTabs.map((tab) => {
            const isActive = activeWorkspaceTab === tab.id;

            return (
              <button
                key={tab.id}
                aria-selected={isActive}
                className={`topbar-chip${isActive ? " active" : ""}`}
                onClick={() => onTabChange(tab.id)}
                role="tab"
                style={workspaceTabStyle}
                type="button"
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="side-box">
          <p>Trip days</p>
          <div className="day-list">
            {days.map((day) => {
              const isActive = selectedDayId === day.id;

              return (
                <button
                  key={day.id}
                  className={`day-pill${isActive ? " active" : ""}`}
                  onClick={() => onSelectDay(day.id)}
                  type="button"
                >
                  <span>{day.label}</span>
                  <strong>{day.title}</strong>
                </button>
              );
            })}
          </div>
        </div>
      </aside>

      <div className="frame-panel frame-panel-board">
        {activeWorkspaceTab === "trip" && (
          <>
            <div className="board-header">
              <div className="frame-header">
                <p className="frame-label">Trip tab</p>
                <h3>{selectedDay?.title ?? "Itinerary"}</h3>
                <p>
                  A day-by-day planning board with enough detail to feel traveled already, but still
                  light enough to rearrange on instinct.
                </p>
              </div>

              <div className="board-actions">
                <span>{tripBrief.travelWindow}</span>
                <span>{tripBrief.pace}</span>
              </div>
            </div>

            <div className="itinerary-grid">
              {days.map((day) => {
                const isSelected = selectedDayId === day.id;

                return (
                  <article key={day.id} className={`day-card${isSelected ? " selected" : ""}`}>
                    <div className="day-card-head">
                      <div>
                        <span>{day.label}</span>
                        <strong>{day.title}</strong>
                      </div>

                      <button
                        className="card-mini-action"
                        onClick={() => onSelectDay(day.id)}
                        type="button"
                      >
                        Focus day
                      </button>
                    </div>

                    <div className="activity-stack">
                      {day.stops.map((stop) => (
                        <button key={`${day.id}-${stop}`} className="activity-chip" type="button">
                          <span className="chip-drag" aria-hidden="true" />
                          <strong>{stop}</strong>
                        </button>
                      ))}
                    </div>
                  </article>
                );
              })}
            </div>
          </>
        )}

        {activeWorkspaceTab === "map" && (
          <div className="day-split">
            <div className="board-header">
              <div className="frame-header">
                <p className="frame-label">Map tab</p>
                <h3>Places in reach of the brief</h3>
                <p>
                  Use the map as a planning companion: check what belongs together, what deserves
                  its own morning, and where the route should breathe.
                </p>
              </div>
            </div>

            <article className="day-card day-card-focus">
              <div className="day-card-head">
                <div>
                  <span>Selected place</span>
                  <strong>{selectedPlace?.name ?? "Choose a place"}</strong>
                </div>
                {selectedPlace && <span>{selectedPlace.district}</span>}
              </div>

              <p className="lede" style={{ margin: 0 }}>
                {selectedPlace?.note ??
                  "The next place you select will anchor the map companion view."}
              </p>
            </article>

            <div className="activity-stack">
              {prototypeData.mapPlaces.map((place) => {
                const isActive = selectedPlace?.id === place.id;

                return (
                  <button
                    key={place.id}
                    className={`activity-chip${isActive ? " active" : ""}`}
                    onClick={() => onSelectPlace(place.id)}
                    type="button"
                  >
                    <span className="chip-drag" aria-hidden="true" />
                    <strong>{place.name}</strong>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {activeWorkspaceTab === "agent" && (
          <div className="day-split">
            <div className="frame-header">
              <p className="frame-label">Agent tab</p>
              <h3>Keep the planning conversation close to the route</h3>
              <p>
                The copilot stays grounded in the brief, the days, and the places already under
                consideration.
              </p>
            </div>

            <div className="share-list">
              {agentMessages.map((message) => (
                <article key={message.id} className="share-row">
                  <strong>Voyage agent</strong>
                  <span>{message.text}</span>
                </article>
              ))}
            </div>
          </div>
        )}

        {activeWorkspaceTab === "share" && (
          <div className="day-split">
            <div className="frame-header">
              <p className="frame-label">Share tab</p>
              <h3>Sharing stays parked for the next task</h3>
              <p>
                The tab is visible in the workspace shell now so the navigation feels complete, but
                review and sharing behavior will arrive in the next pass.
              </p>
            </div>
          </div>
        )}
      </div>

      <aside className="frame-panel frame-panel-detail">
        <div className="detail-block">
          <p>Voyage agent</p>
          <strong>Planning copilot on call</strong>
          <ul>
            {agentMessages.map((message) => (
              <li key={message.id}>{message.text}</li>
            ))}
          </ul>
        </div>

        <div className="detail-block">
          <p>Selected day</p>
          <strong>{selectedDay?.title ?? "Choose a day"}</strong>
          <ul>
            {(selectedDay?.stops ?? []).map((stop) => (
              <li key={stop}>{stop}</li>
            ))}
          </ul>
        </div>
      </aside>

      <div className="workspace-actions">
        <button
          className="button button-secondary"
          onClick={onReviewTrip}
          type="button"
        >
          Review trip
        </button>
      </div>
    </section>
  );
}

function ReviewScreen({ days, onBackToWorkspace, onShare, tripBrief }) {
  return (
    <section className="screen-frame screen-create">
      <div className="frame-panel frame-panel-form">
        <div className="frame-header">
          <p className="frame-label">Review trip</p>
          <h2>Trip review</h2>
          <p>
            Pause before sharing. Check the daily rhythm, the trip brief, and the shape of the route.
          </p>
        </div>

        <div className="review-list">
          {days.map((day) => (
            <article key={day.id} className="day-card">
              <div className="day-card-head">
                <div>
                  <span>{day.label}</span>
                  <strong>{day.title}</strong>
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="footer-actions">
          <button className="button button-secondary" onClick={onBackToWorkspace} type="button">
            Back to workspace
          </button>
          <button className="button button-primary" onClick={onShare} type="button">
            Share trip
          </button>
        </div>
      </div>

      <aside className="frame-panel frame-panel-detail">
        <div className="detail-block">
          <p>Trip brief</p>
          <strong>{tripBrief.destination}</strong>
          <ul>
            <li>{tripBrief.travelWindow}</li>
            <li>{tripBrief.pace}</li>
            <li>{tripBrief.priority}</li>
          </ul>
        </div>
      </aside>
    </section>
  );
}

function ShareScreen({ onBackToWorkspace }) {
  return (
    <section className="screen-frame screen-create">
      <div className="frame-panel frame-panel-form">
        <div className="frame-header">
          <p className="frame-label">Share</p>
          <h2>Share and export</h2>
          <p>
            Hand the trip off cleanly with link sharing, collaborator invites, and export cues.
          </p>
        </div>

        <div className="share-list">
          <article className="share-row">
            <strong>Invite collaborators</strong>
            <span>Keep planning with travel partners.</span>
          </article>
          <article className="share-row">
            <strong>Copy trip link</strong>
            <span>Send a quick mobile-friendly view.</span>
          </article>
          <article className="share-row">
            <strong>Export summary</strong>
            <span>Create a portable itinerary snapshot.</span>
          </article>
        </div>

        <div className="footer-actions">
          <button className="button button-primary" onClick={onBackToWorkspace} type="button">
            Back to workspace
          </button>
        </div>
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
  const currentWorkspaceTab = getWorkspaceTab(activeWorkspaceTab);
  const selectedDay = getSelectedDay(days, selectedDayId);
  const selectedPlace = getSelectedPlace(selectedPlaceId);
  const [email, setEmail] = useState("");
  const [installRequested, setInstallRequested] = useState(false);

  return (
    <main className="system-shell">
      <div className="system-grid" aria-hidden="true" />
      <div className="system-grain" aria-hidden="true" />

      <section className="wireframe-section">
        {currentScreen === "welcome" && (
          <WelcomeScreen
            installRequested={installRequested}
            onInstall={() => setInstallRequested(true)}
            onStart={() => setActiveScreen("entry")}
          />
        )}

        {currentScreen === "entry" && (
          <EntryScreen
            email={email}
            onEmailChange={setEmail}
            onGuest={() => setActiveScreen("trip-brief")}
          />
        )}

        {currentScreen === "trip-brief" && (
          <TripBriefScreen onContinue={() => setActiveScreen("agent-kickoff")} tripBrief={tripBrief} />
        )}

        {currentScreen === "agent-kickoff" && (
          <AgentKickoffScreen
            onOpenWorkspace={() =>
              openWorkspace({
                setActiveScreen,
                setActiveWorkspaceTab,
                setSelectedPlaceId,
              })
            }
            tripBrief={tripBrief}
          />
        )}

        {currentScreen === "workspace" && (
          <WorkspaceScreen
            activeWorkspaceTab={currentWorkspaceTab}
            agentMessages={agentMessages}
            days={days}
            onReviewTrip={() => setActiveScreen("review")}
            onSelectDay={(dayId) =>
              selectDay({
                dayId,
                setActiveWorkspaceTab,
                setSelectedDayId,
              })
            }
            onSelectPlace={setSelectedPlaceId}
            onTabChange={(nextTab) =>
              changeWorkspaceTab({
                nextTab,
                selectedPlaceId,
                setActiveWorkspaceTab,
                setSelectedPlaceId,
              })
            }
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

        {currentScreen === "share" && (
          <ShareScreen
            onBackToWorkspace={() => setActiveScreen("workspace")}
          />
        )}
      </section>
    </main>
  );
}
