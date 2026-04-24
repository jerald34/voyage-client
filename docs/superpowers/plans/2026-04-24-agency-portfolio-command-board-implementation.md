# Agency Portfolio Command Board Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current single-trip `HomePage.jsx` with an Agent-centered agency portfolio dashboard using backend-shaped prototype data.

**Architecture:** Keep `HomePage.jsx` as the composition layer and add focused agency dashboard components under `app/components/trip-dashboard`. Add a small `app/lib/agency-dashboard/selectors.js` module for derived metrics, urgent departures, approval blockers, and Agent priority ranking so the UI does not hard-code portfolio counts.

**Tech Stack:** Next.js 16, React 19, Vitest, React Testing Library, plain CSS in `app/globals.css`.

---

## File Structure

- Create `app/data/prototype/agency-portfolio.js`
  - Owns backend-shaped mock agency trip data.
  - Exports `initialAgencyPortfolioTrips`.
- Create `app/lib/agency-dashboard/selectors.js`
  - Owns all derived dashboard values and ordering logic.
  - Exports `getAgencyPortfolioSummary`, `getUrgentDepartures`, `getApprovalBlockers`, `getAgentPriorityQueue`, `getAgentCommandInsights`, and `getDaysUntilDeparture`.
- Create `app/components/trip-dashboard/AgentCommandCenter.jsx`
  - Renders Agent overview, insight chips, and Agent command CTAs.
- Create `app/components/trip-dashboard/AgencyMetricStrip.jsx`
  - Renders derived agency metrics.
- Create `app/components/trip-dashboard/AgentPriorityQueue.jsx`
  - Renders Agent-ranked priority items.
- Create `app/components/trip-dashboard/UrgentDeparturesPanel.jsx`
  - Renders departure-focused list and empty state.
- Create `app/components/trip-dashboard/ApprovalQueuePanel.jsx`
  - Renders approval blocker list and empty state.
- Create `app/components/trip-dashboard/ClientTripPortfolio.jsx`
  - Renders all active client trips in a dense card/table hybrid.
- Modify `app/components/trip-dashboard/HomePage.jsx`
  - Replace single-trip dashboard composition with the agency dashboard.
  - Keep `onContinue` as the prototype handler for `Run Agency Review`.
  - Accept `agencyTrips` prop and fall back to `initialAgencyPortfolioTrips`.
- Modify `app/data/prototype/trip-dashboard.js`
  - Re-export agency portfolio data through `prototypeData.agencyPortfolioTrips`.
- Modify `app/page.jsx`
  - Pass `prototypeData.agencyPortfolioTrips` into `HomePage`.
- Modify `app/globals.css`
  - Add agency dashboard styles and keep existing trip detail styles intact.
- Modify `tests/home-page.test.jsx`
  - Replace homepage expectations with agency dashboard expectations.
  - Add empty-state tests.
- Modify `tests/prototype-flow.test.jsx`
  - Update authenticated handoff expectations from itinerary page copy to agency dashboard copy.
- Create `tests/agency-dashboard-selectors.test.jsx`
  - Unit-test portfolio metrics, ranking, blockers, and fallback labels.

---

### Task 1: Agency Portfolio Data And Selectors

**Files:**
- Create: `app/data/prototype/agency-portfolio.js`
- Create: `app/lib/agency-dashboard/selectors.js`
- Modify: `app/data/prototype/trip-dashboard.js`
- Test: `tests/agency-dashboard-selectors.test.jsx`

- [ ] **Step 1: Write the failing selector tests**

Create `tests/agency-dashboard-selectors.test.jsx`:

```jsx
import { describe, expect, it } from "vitest";

import {
  getAgencyPortfolioSummary,
  getAgentCommandInsights,
  getAgentPriorityQueue,
  getApprovalBlockers,
  getDaysUntilDeparture,
  getUrgentDepartures,
} from "../app/lib/agency-dashboard/selectors.js";

const referenceDate = new Date("2026-04-24T00:00:00+08:00");

const trips = [
  {
    id: "trip-1",
    clientName: "Santos Family",
    destination: "Olongapo City",
    travelWindow: "May 12-17, 2026",
    departureDate: "2026-05-12",
    assignedOrganizer: "Mara",
    readinessPercent: 68,
    approvalStatus: "Awaiting itinerary approval",
    riskLevel: "Medium",
    nextAction: "Draft client approval reminder",
    agentInsight: "Departure is inside 30 days and itinerary approval is still pending.",
    status: "active",
  },
  {
    id: "trip-2",
    clientName: "Reyes Group",
    destination: "Baguio",
    travelWindow: "May 2-5, 2026",
    departureDate: "2026-05-02",
    assignedOrganizer: "Luis",
    readinessPercent: 82,
    approvalStatus: "Final confirmation pending",
    riskLevel: "High",
    nextAction: "Review readiness",
    agentInsight: "High-risk trip departs soon and still needs final confirmation.",
    status: "active",
  },
  {
    id: "trip-3",
    clientName: "Lim Honeymoon",
    destination: "El Nido",
    travelWindow: "July 9-14, 2026",
    departureDate: "2026-07-09",
    assignedOrganizer: "Ari",
    readinessPercent: 92,
    approvalStatus: "Approved",
    riskLevel: "Low",
    nextAction: "Open trip",
    agentInsight: "Trip is healthy and ready for final polish.",
    status: "active",
  },
  {
    id: "trip-4",
    clientName: "Archived Client",
    destination: "Cebu",
    travelWindow: "March 1-4, 2026",
    departureDate: "2026-03-01",
    assignedOrganizer: "Mara",
    readinessPercent: 100,
    approvalStatus: "Approved",
    riskLevel: "Low",
    nextAction: "Open trip",
    agentInsight: "Archived trip.",
    status: "archived",
  },
];

describe("agency dashboard selectors", () => {
  it("calculates portfolio metrics from active trips", () => {
    expect(getAgencyPortfolioSummary(trips, referenceDate)).toEqual({
      activeTrips: 3,
      departuresIn30Days: 2,
      awaitingApproval: 2,
      atRisk: 2,
    });
  });

  it("orders urgent departures by departure date", () => {
    expect(getUrgentDepartures(trips, referenceDate).map((trip) => trip.clientName)).toEqual([
      "Reyes Group",
      "Santos Family",
    ]);
  });

  it("returns approval blockers and excludes approved trips", () => {
    expect(getApprovalBlockers(trips).map((trip) => trip.approvalStatus)).toEqual([
      "Awaiting itinerary approval",
      "Final confirmation pending",
    ]);
  });

  it("ranks the Agent queue by combined urgency, risk, and approval blockers", () => {
    expect(getAgentPriorityQueue(trips, referenceDate).map((trip) => trip.clientName)).toEqual([
      "Reyes Group",
      "Santos Family",
      "Lim Honeymoon",
    ]);
  });

  it("builds command insights from summary values", () => {
    expect(getAgentCommandInsights(trips, referenceDate)).toEqual([
      "2 approvals blocking production",
      "2 departures inside 30 days",
      "2 trips flagged at risk",
    ]);
  });

  it("returns null for invalid departure dates", () => {
    expect(getDaysUntilDeparture("date pending", referenceDate)).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm test -- agency-dashboard-selectors.test.jsx
```

Expected: FAIL because `app/lib/agency-dashboard/selectors.js` does not exist.

- [ ] **Step 3: Add backend-shaped agency portfolio data**

Create `app/data/prototype/agency-portfolio.js`:

```js
export const initialAgencyPortfolioTrips = [
  {
    id: "trip-santos-olongapo",
    clientName: "Santos Family",
    destination: "Olongapo City",
    travelWindow: "May 12-17, 2026",
    departureDate: "2026-05-12",
    assignedOrganizer: "Mara",
    readinessPercent: 68,
    approvalStatus: "Awaiting itinerary approval",
    riskLevel: "Medium",
    nextAction: "Draft client approval reminder",
    agentInsight: "Departure is inside 30 days and itinerary approval is still pending.",
    status: "active",
  },
  {
    id: "trip-reyes-baguio",
    clientName: "Reyes Group",
    destination: "Baguio",
    travelWindow: "May 2-5, 2026",
    departureDate: "2026-05-02",
    assignedOrganizer: "Luis",
    readinessPercent: 82,
    approvalStatus: "Final confirmation pending",
    riskLevel: "High",
    nextAction: "Review readiness",
    agentInsight: "High-risk trip departs soon and still needs final confirmation.",
    status: "active",
  },
  {
    id: "trip-lim-el-nido",
    clientName: "Lim Honeymoon",
    destination: "El Nido",
    travelWindow: "July 9-14, 2026",
    departureDate: "2026-07-09",
    assignedOrganizer: "Ari",
    readinessPercent: 92,
    approvalStatus: "Approved",
    riskLevel: "Low",
    nextAction: "Open trip",
    agentInsight: "Trip is healthy and ready for final polish.",
    status: "active",
  },
  {
    id: "trip-dela-cruz-cebu",
    clientName: "Dela Cruz Anniversary",
    destination: "Cebu",
    travelWindow: "June 3-7, 2026",
    departureDate: "2026-06-03",
    assignedOrganizer: "Mara",
    readinessPercent: 54,
    approvalStatus: "Awaiting hotel preference",
    riskLevel: "Medium",
    nextAction: "Draft hotel preference reminder",
    agentInsight: "Hotel preference is blocking booking confirmation.",
    status: "active",
  },
];

export default initialAgencyPortfolioTrips;
```

Modify `app/data/prototype/trip-dashboard.js`:

```js
import { initialAgencyPortfolioTrips } from "./agency-portfolio.js";
```

Add `agencyPortfolioTrips` to `prototypeData`:

```js
export const prototypeData = {
  workspaceTabs: prototypeWorkspaceTabs,
  tripBrief: initialTripBrief,
  itineraryDays: initialItineraryDays,
  mapPlaces: initialMapPlaces,
  agentMessages: initialAgentMessages,
  agencyPortfolioTrips: initialAgencyPortfolioTrips,
};
```

- [ ] **Step 4: Add selector implementation**

Create `app/lib/agency-dashboard/selectors.js`:

```js
const APPROVAL_BLOCKER_TERMS = ["awaiting", "pending", "requested changes", "missing", "needs"];
const RISK_WEIGHTS = {
  high: 45,
  medium: 25,
  low: 5,
};

function normalize(value) {
  return String(value ?? "").trim().toLowerCase();
}

function getActiveTrips(trips) {
  return (Array.isArray(trips) ? trips : []).filter((trip) => normalize(trip?.status || "active") !== "archived");
}

export function getDaysUntilDeparture(departureDate, referenceDate = new Date()) {
  const parsedDeparture = new Date(`${departureDate}T00:00:00`);

  if (Number.isNaN(parsedDeparture.getTime())) {
    return null;
  }

  const startOfReference = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), referenceDate.getDate());
  const startOfDeparture = new Date(
    parsedDeparture.getFullYear(),
    parsedDeparture.getMonth(),
    parsedDeparture.getDate(),
  );

  return Math.round((startOfDeparture.getTime() - startOfReference.getTime()) / 86400000);
}

export function isApprovalBlocker(trip) {
  const approvalStatus = normalize(trip?.approvalStatus);

  if (!approvalStatus || approvalStatus === "approved") {
    return false;
  }

  return APPROVAL_BLOCKER_TERMS.some((term) => approvalStatus.includes(term));
}

export function getUrgentDepartures(trips, referenceDate = new Date(), windowDays = 30) {
  return getActiveTrips(trips)
    .map((trip) => ({
      ...trip,
      daysUntilDeparture: getDaysUntilDeparture(trip?.departureDate, referenceDate),
    }))
    .filter((trip) => trip.daysUntilDeparture !== null && trip.daysUntilDeparture >= 0 && trip.daysUntilDeparture <= windowDays)
    .sort((firstTrip, secondTrip) => firstTrip.daysUntilDeparture - secondTrip.daysUntilDeparture);
}

export function getApprovalBlockers(trips) {
  return getActiveTrips(trips).filter(isApprovalBlocker);
}

export function getAgencyPortfolioSummary(trips, referenceDate = new Date()) {
  const activeTrips = getActiveTrips(trips);
  const urgentDepartures = getUrgentDepartures(activeTrips, referenceDate);
  const approvalBlockers = getApprovalBlockers(activeTrips);

  return {
    activeTrips: activeTrips.length,
    departuresIn30Days: urgentDepartures.length,
    awaitingApproval: approvalBlockers.length,
    atRisk: activeTrips.filter((trip) => ["high", "medium"].includes(normalize(trip?.riskLevel))).length,
  };
}

function getPriorityScore(trip, referenceDate) {
  const daysUntilDeparture = getDaysUntilDeparture(trip?.departureDate, referenceDate);
  const departureScore = daysUntilDeparture === null ? 0 : Math.max(0, 40 - daysUntilDeparture);
  const approvalScore = isApprovalBlocker(trip) ? 35 : 0;
  const riskScore = RISK_WEIGHTS[normalize(trip?.riskLevel)] ?? 0;
  const readinessScore = Math.max(0, 100 - Number(trip?.readinessPercent ?? 0)) / 4;

  return departureScore + approvalScore + riskScore + readinessScore;
}

export function getAgentPriorityQueue(trips, referenceDate = new Date(), limit = 4) {
  return getActiveTrips(trips)
    .map((trip) => ({
      ...trip,
      daysUntilDeparture: getDaysUntilDeparture(trip?.departureDate, referenceDate),
      priorityScore: getPriorityScore(trip, referenceDate),
    }))
    .sort((firstTrip, secondTrip) => secondTrip.priorityScore - firstTrip.priorityScore)
    .slice(0, limit);
}

export function getAgentCommandInsights(trips, referenceDate = new Date()) {
  const summary = getAgencyPortfolioSummary(trips, referenceDate);

  return [
    `${summary.awaitingApproval} approvals blocking production`,
    `${summary.departuresIn30Days} departures inside 30 days`,
    `${summary.atRisk} trips flagged at risk`,
  ];
}
```

- [ ] **Step 5: Run selector tests**

Run:

```bash
npm test -- agency-dashboard-selectors.test.jsx
```

Expected: PASS.

- [ ] **Step 6: Commit**

Run:

```bash
git add app/data/prototype/agency-portfolio.js app/data/prototype/trip-dashboard.js app/lib/agency-dashboard/selectors.js tests/agency-dashboard-selectors.test.jsx
git commit -m "feat: add agency portfolio selectors"
```

---

### Task 2: Agency Dashboard Components

**Files:**
- Create: `app/components/trip-dashboard/AgentCommandCenter.jsx`
- Create: `app/components/trip-dashboard/AgencyMetricStrip.jsx`
- Create: `app/components/trip-dashboard/AgentPriorityQueue.jsx`
- Create: `app/components/trip-dashboard/UrgentDeparturesPanel.jsx`
- Create: `app/components/trip-dashboard/ApprovalQueuePanel.jsx`
- Create: `app/components/trip-dashboard/ClientTripPortfolio.jsx`
- Test: `tests/home-page.test.jsx`

- [ ] **Step 1: Replace homepage render test with agency expectations**

In `tests/home-page.test.jsx`, keep the `useTripDashboard` harness tests unchanged, then replace the `Trip dashboard HomePage` suite with:

```jsx
describe("Agency portfolio HomePage", () => {
  const agencyTrips = [
    {
      id: "trip-1",
      clientName: "Santos Family",
      destination: "Olongapo City",
      travelWindow: "May 12-17, 2026",
      departureDate: "2026-05-12",
      assignedOrganizer: "Mara",
      readinessPercent: 68,
      approvalStatus: "Awaiting itinerary approval",
      riskLevel: "Medium",
      nextAction: "Draft client approval reminder",
      agentInsight: "Departure is inside 30 days and itinerary approval is still pending.",
      status: "active",
    },
    {
      id: "trip-2",
      clientName: "Reyes Group",
      destination: "Baguio",
      travelWindow: "May 2-5, 2026",
      departureDate: "2026-05-02",
      assignedOrganizer: "Luis",
      readinessPercent: 82,
      approvalStatus: "Final confirmation pending",
      riskLevel: "High",
      nextAction: "Review readiness",
      agentInsight: "High-risk trip departs soon and still needs final confirmation.",
      status: "active",
    },
  ];

  it("renders the Agent-centered agency portfolio dashboard", () => {
    render(<HomePage agencyTrips={agencyTrips} onContinue={vi.fn()} />);

    expect(screen.getByText("Agency Portfolio")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Agent Command Center" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Run Agency Review" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Prepare today's client follow-ups" })).toBeInTheDocument();
    expect(screen.getByText("2 approvals blocking production")).toBeInTheDocument();
    expect(screen.getByText("Active trips")).toBeInTheDocument();
    expect(screen.getByText("Departures in 30 days")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Priority Queue" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Urgent Departures" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Approval Blockers" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Client Trip Portfolio" })).toBeInTheDocument();
    expect(screen.getByText("Santos Family")).toBeInTheDocument();
    expect(screen.getByText("Olongapo City")).toBeInTheDocument();
    expect(screen.getByText("Ready 68%")).toBeInTheDocument();
  });

  it("wires Agent command actions through the homepage", () => {
    const onContinue = vi.fn();

    render(<HomePage agencyTrips={agencyTrips} onContinue={onContinue} />);

    fireEvent.click(screen.getByRole("button", { name: "Run Agency Review" }));

    expect(onContinue).toHaveBeenCalledTimes(1);
  });

  it("renders empty states for an empty portfolio", () => {
    render(<HomePage agencyTrips={[]} onContinue={vi.fn()} />);

    expect(screen.getByText("No active client trips yet.")).toBeInTheDocument();
    expect(screen.getByText("No departures need attention this week.")).toBeInTheDocument();
    expect(screen.getByText("No client approvals are blocking production.")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm test -- home-page.test.jsx
```

Expected: FAIL because the agency dashboard components and copy do not exist yet.

- [ ] **Step 3: Add `AgentCommandCenter.jsx`**

Create `app/components/trip-dashboard/AgentCommandCenter.jsx`:

```jsx
export default function AgentCommandCenter({ insights, onRunReview }) {
  const safeInsights = Array.isArray(insights) ? insights : [];

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
          <button className="button button-secondary" type="button">
            Prepare today's client follow-ups
          </button>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Add `AgencyMetricStrip.jsx`**

Create `app/components/trip-dashboard/AgencyMetricStrip.jsx`:

```jsx
const metricItems = [
  { id: "activeTrips", label: "Active trips" },
  { id: "departuresIn30Days", label: "Departures in 30 days" },
  { id: "awaitingApproval", label: "Awaiting approval" },
  { id: "atRisk", label: "At risk" },
];

export default function AgencyMetricStrip({ summary }) {
  return (
    <section aria-label="Agency portfolio metrics" className="agency-metric-strip">
      {metricItems.map((item) => (
        <article key={item.id} className="agency-metric-card">
          <span className="frame-label">{item.label}</span>
          <strong>{summary?.[item.id] ?? 0}</strong>
        </article>
      ))}
    </section>
  );
}
```

- [ ] **Step 5: Add priority and queue components**

Create `app/components/trip-dashboard/AgentPriorityQueue.jsx`:

```jsx
function getDepartureLabel(daysUntilDeparture) {
  if (typeof daysUntilDeparture !== "number") {
    return "Departure date pending";
  }

  if (daysUntilDeparture === 0) {
    return "Departs today";
  }

  if (daysUntilDeparture === 1) {
    return "Departs tomorrow";
  }

  return `Departs in ${daysUntilDeparture} days`;
}

export default function AgentPriorityQueue({ trips }) {
  const safeTrips = Array.isArray(trips) ? trips : [];

  return (
    <section className="agency-panel frame-panel">
      <div className="agency-panel-heading">
        <span className="frame-label">Agent ranked</span>
        <h2>Priority Queue</h2>
      </div>

      {safeTrips.length === 0 ? (
        <p className="agency-empty-state">No active client trips yet.</p>
      ) : (
        <div className="agency-priority-list">
          {safeTrips.map((trip) => (
            <article key={trip.id} className="agency-priority-item">
              <div>
                <strong>{trip.clientName || "Unnamed client"}</strong>
                <span>{trip.destination || "Destination pending"}</span>
              </div>
              <p>{trip.agentInsight || "Agent review pending."}</p>
              <div className="agency-trip-meta">
                <span>{getDepartureLabel(trip.daysUntilDeparture)}</span>
                <span>Ready {trip.readinessPercent ?? 0}%</span>
                <span>{trip.approvalStatus || "Approval not requested"}</span>
              </div>
              <button className="button button-secondary" type="button">
                {trip.nextAction || "Open trip"}
              </button>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
```

Create `app/components/trip-dashboard/UrgentDeparturesPanel.jsx`:

```jsx
export default function UrgentDeparturesPanel({ trips }) {
  const safeTrips = Array.isArray(trips) ? trips : [];

  return (
    <section className="agency-panel frame-panel">
      <div className="agency-panel-heading">
        <span className="frame-label">Departures soon</span>
        <h2>Urgent Departures</h2>
      </div>

      {safeTrips.length === 0 ? (
        <p className="agency-empty-state">No departures need attention this week.</p>
      ) : (
        <div className="agency-compact-list">
          {safeTrips.map((trip) => (
            <article key={trip.id} className="agency-compact-row">
              <div>
                <strong>{trip.clientName || "Unnamed client"}</strong>
                <span>{trip.destination || "Destination pending"}</span>
              </div>
              <div className="agency-trip-meta">
                <span>{trip.travelWindow || "Dates pending"}</span>
                <span>Ready {trip.readinessPercent ?? 0}%</span>
                <span>{trip.riskLevel || "Risk pending"}</span>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
```

Create `app/components/trip-dashboard/ApprovalQueuePanel.jsx`:

```jsx
export default function ApprovalQueuePanel({ trips }) {
  const safeTrips = Array.isArray(trips) ? trips : [];

  return (
    <section className="agency-panel frame-panel">
      <div className="agency-panel-heading">
        <span className="frame-label">Client blockers</span>
        <h2>Approval Blockers</h2>
      </div>

      {safeTrips.length === 0 ? (
        <p className="agency-empty-state">No client approvals are blocking production.</p>
      ) : (
        <div className="agency-compact-list">
          {safeTrips.map((trip) => (
            <article key={trip.id} className="agency-compact-row">
              <div>
                <strong>{trip.clientName || "Unnamed client"}</strong>
                <span>{trip.destination || "Destination pending"}</span>
              </div>
              <div className="agency-trip-meta">
                <span>{trip.approvalStatus || "Approval not requested"}</span>
                <span>{trip.nextAction || "Next action pending"}</span>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
```

- [ ] **Step 6: Add `ClientTripPortfolio.jsx`**

Create `app/components/trip-dashboard/ClientTripPortfolio.jsx`:

```jsx
export default function ClientTripPortfolio({ trips }) {
  const safeTrips = Array.isArray(trips) ? trips : [];

  return (
    <section className="agency-panel frame-panel">
      <div className="agency-panel-heading">
        <span className="frame-label">All active trips</span>
        <h2>Client Trip Portfolio</h2>
      </div>

      {safeTrips.length === 0 ? (
        <p className="agency-empty-state">No active client trips yet.</p>
      ) : (
        <div className="agency-portfolio-grid">
          {safeTrips.map((trip) => (
            <article key={trip.id} className="agency-trip-card">
              <div className="agency-trip-card-header">
                <div>
                  <strong>{trip.clientName || "Unnamed client"}</strong>
                  <span>{trip.destination || "Destination pending"}</span>
                </div>
                <span className={`agency-risk-pill risk-${String(trip.riskLevel || "pending").toLowerCase()}`}>
                  {trip.riskLevel || "Risk pending"}
                </span>
              </div>
              <div className="agency-readiness">
                <div>
                  <span>Ready {trip.readinessPercent ?? 0}%</span>
                  <span>{trip.travelWindow || "Dates pending"}</span>
                </div>
                <div aria-hidden="true" className="agency-readiness-bar">
                  <div style={{ width: `${trip.readinessPercent ?? 0}%` }} />
                </div>
              </div>
              <dl className="agency-trip-details">
                <div>
                  <dt>Organizer</dt>
                  <dd>{trip.assignedOrganizer || "Organizer unassigned"}</dd>
                </div>
                <div>
                  <dt>Approval</dt>
                  <dd>{trip.approvalStatus || "Approval not requested"}</dd>
                </div>
                <div>
                  <dt>Next action</dt>
                  <dd>{trip.nextAction || "Next action pending"}</dd>
                </div>
              </dl>
              <button className="button button-secondary" type="button">
                Open trip
              </button>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
```

- [ ] **Step 7: Run homepage tests**

Run:

```bash
npm test -- home-page.test.jsx
```

Expected: still FAIL because `HomePage.jsx` has not composed the new components yet.

- [ ] **Step 8: Commit**

Run:

```bash
git add app/components/trip-dashboard/AgentCommandCenter.jsx app/components/trip-dashboard/AgencyMetricStrip.jsx app/components/trip-dashboard/AgentPriorityQueue.jsx app/components/trip-dashboard/UrgentDeparturesPanel.jsx app/components/trip-dashboard/ApprovalQueuePanel.jsx app/components/trip-dashboard/ClientTripPortfolio.jsx tests/home-page.test.jsx
git commit -m "feat: add agency dashboard components"
```

---

### Task 3: Compose Agency HomePage And Prototype Flow

**Files:**
- Modify: `app/components/trip-dashboard/HomePage.jsx`
- Modify: `app/page.jsx`
- Modify: `tests/prototype-flow.test.jsx`
- Test: `tests/home-page.test.jsx`
- Test: `tests/prototype-flow.test.jsx`

- [ ] **Step 1: Update prototype flow test expectations**

In `tests/prototype-flow.test.jsx`, change `renderAuthenticatedPage` to wait for:

```jsx
await screen.findByRole("heading", { name: "Agent Command Center" });
```

In the first flow test, click:

```jsx
fireEvent.click(screen.getByRole("button", { name: "Run Agency Review" }));
```

In the second flow test, update the agency dashboard assertion:

```jsx
expect(screen.getByRole("heading", { name: "Agent Command Center" })).toBeInTheDocument();
expect(screen.getByText("Agency Portfolio")).toBeInTheDocument();
fireEvent.click(screen.getByRole("button", { name: "Run Agency Review" }));
```

- [ ] **Step 2: Run tests to verify they fail**

Run:

```bash
npm test -- home-page.test.jsx prototype-flow.test.jsx
```

Expected: FAIL because `HomePage.jsx` still renders the old itinerary dashboard.

- [ ] **Step 3: Replace `HomePage.jsx` composition**

Replace `app/components/trip-dashboard/HomePage.jsx` with:

```jsx
"use client";

import { initialAgencyPortfolioTrips } from "../../data/prototype/agency-portfolio.js";
import {
  getAgencyPortfolioSummary,
  getAgentCommandInsights,
  getAgentPriorityQueue,
  getApprovalBlockers,
  getUrgentDepartures,
} from "../../lib/agency-dashboard/selectors.js";
import AgentCommandCenter from "./AgentCommandCenter.jsx";
import AgencyMetricStrip from "./AgencyMetricStrip.jsx";
import AgentPriorityQueue from "./AgentPriorityQueue.jsx";
import ApprovalQueuePanel from "./ApprovalQueuePanel.jsx";
import ClientTripPortfolio from "./ClientTripPortfolio.jsx";
import UrgentDeparturesPanel from "./UrgentDeparturesPanel.jsx";

export default function HomePage({ agencyTrips = initialAgencyPortfolioTrips, onContinue }) {
  const summary = getAgencyPortfolioSummary(agencyTrips);
  const insights = getAgentCommandInsights(agencyTrips);
  const priorityQueue = getAgentPriorityQueue(agencyTrips);
  const urgentDepartures = getUrgentDepartures(agencyTrips);
  const approvalBlockers = getApprovalBlockers(agencyTrips);

  return (
    <div className="trip-dashboard-shell agency-dashboard-shell">
      <header className="landing-header trip-dashboard-header agency-dashboard-header">
        <a className="landing-brand" href="#home">
          Voyage
        </a>
        <div className="agency-header-context">
          <div>
            <span>Agency Portfolio</span>
            <strong>Operations desk</strong>
          </div>
          <div className="agency-avatar" aria-hidden="true">
            A
          </div>
        </div>
      </header>

      <AgentCommandCenter insights={insights} onRunReview={onContinue} />
      <AgencyMetricStrip summary={summary} />

      <div className="agency-dashboard-grid">
        <AgentPriorityQueue trips={priorityQueue} />
        <div className="agency-side-stack">
          <UrgentDeparturesPanel trips={urgentDepartures} />
          <ApprovalQueuePanel trips={approvalBlockers} />
        </div>
      </div>

      <ClientTripPortfolio trips={agencyTrips} />
    </div>
  );
}
```

- [ ] **Step 4: Pass agency trips from `app/page.jsx`**

In `app/page.jsx`, update the `HomePage` render:

```jsx
<HomePage
  agencyTrips={prototypeData.agencyPortfolioTrips}
  onContinue={() => setActiveScreen("agent-kickoff")}
/>
```

Remove old `HomePage` props that are no longer used:

```jsx
days={dashboard.days}
mapHighlights={dashboard.mapHighlights}
nextActiveDay={dashboard.nextActiveDay}
onMarkDayDone={dashboard.markDayDone}
onToggleLocation={dashboard.toggleLocationComplete}
tripBrief={tripBrief}
tripProgress={dashboard.tripProgress}
```

- [ ] **Step 5: Run focused tests**

Run:

```bash
npm test -- home-page.test.jsx prototype-flow.test.jsx
```

Expected: PASS.

- [ ] **Step 6: Commit**

Run:

```bash
git add app/components/trip-dashboard/HomePage.jsx app/page.jsx tests/prototype-flow.test.jsx
git commit -m "feat: compose agency portfolio homepage"
```

---

### Task 4: Agency Dashboard Styling

**Files:**
- Modify: `app/globals.css`
- Test: `tests/home-page.test.jsx`

- [ ] **Step 1: Add CSS selectors to the render test**

In `tests/home-page.test.jsx`, add these assertions inside the agency dashboard render test:

```jsx
expect(screen.getByRole("heading", { name: "Agent Command Center" }).closest(".agency-agent-panel")).not.toBeNull();
expect(screen.getByLabelText("Agency portfolio metrics")).toHaveClass("agency-metric-strip");
```

- [ ] **Step 2: Run test to verify current structure is present**

Run:

```bash
npm test -- home-page.test.jsx
```

Expected: PASS if Task 3 already added the class names. If it fails, fix component class names before adding CSS.

- [ ] **Step 3: Add agency CSS**

Append this near the existing trip dashboard CSS in `app/globals.css`:

```css
.agency-dashboard-shell {
  gap: 14px;
}

.agency-dashboard-header {
  position: relative;
}

.agency-header-context {
  display: flex;
  gap: 14px;
  align-items: center;
}

.agency-header-context div:first-child {
  display: grid;
  gap: 4px;
  text-align: right;
}

.agency-header-context span {
  color: var(--voyage-text-muted);
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.agency-header-context strong {
  color: var(--voyage-text);
  font-size: 0.95rem;
}

.agency-avatar {
  display: grid;
  width: 44px;
  height: 44px;
  place-items: center;
  border: 2px solid rgba(255, 255, 255, 0.82);
  border-radius: 50%;
  background: var(--voyage-primary);
  color: #fff;
  font-weight: 800;
  box-shadow: var(--voyage-shadow-soft);
}

.agency-agent-panel {
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(320px, 0.85fr);
  gap: 22px;
  align-items: stretch;
  padding: 26px 30px;
  background:
    linear-gradient(120deg, rgba(239, 241, 243, 0.96), rgba(255, 255, 255, 0.9)),
    linear-gradient(135deg, rgba(34, 56, 67, 0.08), rgba(215, 122, 97, 0.08));
}

.agency-agent-copy {
  display: grid;
  align-content: center;
  gap: 10px;
}

.agency-agent-copy h1,
.agency-panel-heading h2 {
  margin: 0;
}

.agency-agent-actions {
  display: grid;
  gap: 16px;
  padding: 18px;
  border: 1px solid rgba(34, 56, 67, 0.08);
  border-radius: var(--voyage-radius-md);
  background: rgba(255, 255, 255, 0.78);
  box-shadow: var(--voyage-shadow-soft);
}

.agency-agent-insights,
.agency-command-buttons,
.agency-trip-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.agency-agent-insights span,
.agency-trip-meta span,
.agency-risk-pill {
  border: 1px solid rgba(34, 56, 67, 0.08);
  border-radius: var(--voyage-radius-pill);
  background: rgba(255, 255, 255, 0.82);
  color: var(--voyage-primary);
  font-size: 0.78rem;
  font-weight: 800;
  padding: 8px 10px;
}

.agency-metric-strip {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.agency-metric-card,
.agency-panel,
.agency-trip-card {
  border: 1px solid var(--voyage-border);
  background: rgba(255, 255, 255, 0.94);
  box-shadow: var(--voyage-shadow-soft);
}

.agency-metric-card {
  padding: 16px 18px;
  border-radius: var(--voyage-radius-md);
}

.agency-metric-card strong {
  display: block;
  margin-top: 8px;
  color: var(--voyage-primary);
  font-size: 1.45rem;
}

.agency-dashboard-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(320px, 0.85fr);
  gap: 16px;
  align-items: start;
}

.agency-side-stack,
.agency-priority-list,
.agency-compact-list,
.agency-portfolio-grid {
  display: grid;
  gap: 12px;
}

.agency-panel {
  display: grid;
  gap: 16px;
  padding: 20px;
  border-radius: var(--voyage-radius-lg);
}

.agency-panel-heading {
  display: grid;
  gap: 6px;
}

.agency-priority-item,
.agency-compact-row,
.agency-trip-card {
  display: grid;
  gap: 12px;
  padding: 16px;
  border: 1px solid rgba(34, 56, 67, 0.08);
  border-radius: var(--voyage-radius-md);
  background: rgba(248, 249, 250, 0.78);
}

.agency-priority-item > div:first-child,
.agency-compact-row > div:first-child,
.agency-trip-card-header,
.agency-readiness > div:first-child {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: flex-start;
}

.agency-priority-item strong,
.agency-compact-row strong,
.agency-trip-card strong {
  color: var(--voyage-primary);
}

.agency-priority-item span,
.agency-compact-row span,
.agency-trip-card span,
.agency-priority-item p,
.agency-empty-state {
  color: var(--voyage-text-muted);
}

.agency-priority-item p,
.agency-empty-state {
  margin: 0;
}

.agency-portfolio-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.agency-risk-pill.risk-high {
  background: rgba(215, 122, 97, 0.14);
  color: #9d3f2f;
}

.agency-risk-pill.risk-medium {
  background: rgba(244, 177, 131, 0.18);
  color: #8a5528;
}

.agency-risk-pill.risk-low {
  background: rgba(122, 152, 137, 0.14);
  color: #496c5b;
}

.agency-readiness {
  display: grid;
  gap: 8px;
}

.agency-readiness-bar {
  height: 10px;
  overflow: hidden;
  border-radius: 999px;
  background: rgba(34, 56, 67, 0.08);
}

.agency-readiness-bar div {
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, var(--voyage-secondary), #f4b183);
}

.agency-trip-details {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  margin: 0;
}

.agency-trip-details div {
  display: grid;
  gap: 4px;
}

.agency-trip-details dt {
  color: var(--voyage-text-muted);
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.agency-trip-details dd {
  margin: 0;
  color: var(--voyage-primary);
  font-size: 0.88rem;
  font-weight: 700;
}

@media (max-width: 980px) {
  .agency-agent-panel,
  .agency-dashboard-grid,
  .agency-metric-strip,
  .agency-portfolio-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .agency-agent-panel,
  .agency-panel,
  .agency-trip-card {
    padding: 18px;
  }

  .agency-command-buttons .button {
    width: 100%;
  }

  .agency-trip-card-header,
  .agency-readiness > div:first-child,
  .agency-priority-item > div:first-child,
  .agency-compact-row > div:first-child {
    display: grid;
  }

  .agency-trip-details {
    grid-template-columns: 1fr;
  }
}
```

- [ ] **Step 4: Run focused tests**

Run:

```bash
npm test -- home-page.test.jsx prototype-flow.test.jsx
```

Expected: PASS.

- [ ] **Step 5: Run build**

Run:

```bash
npm run build
```

Expected: PASS with a successful Next.js production build.

- [ ] **Step 6: Commit**

Run:

```bash
git add app/globals.css tests/home-page.test.jsx
git commit -m "style: add agency portfolio dashboard layout"
```

---

### Task 5: Full Verification And Cleanup

**Files:**
- Modify only if verification finds a real issue.

- [ ] **Step 1: Run the full test suite**

Run:

```bash
npm test
```

Expected: PASS.

- [ ] **Step 2: Run production build**

Run:

```bash
npm run build
```

Expected: PASS.

- [ ] **Step 3: Check git status**

Run:

```bash
git status --short
```

Expected: clean working tree.

- [ ] **Step 4: If the working tree is not clean, review the diff**

Run:

```bash
git diff --stat
git diff
```

Expected: only intentional changes. Commit any fixes with a focused message.

---

## Self-Review

Spec coverage:

- Agent Command Center: Task 2 and Task 3.
- Agency metrics derived from portfolio data: Task 1 and Task 2.
- Agent priority queue: Task 1 and Task 2.
- Urgent departures: Task 1 and Task 2.
- Approval blockers: Task 1 and Task 2.
- Portfolio board: Task 2.
- Backend-shaped mock data: Task 1.
- Existing itinerary/detail components preserved: Task 3 replaces only `HomePage.jsx` composition and leaves existing detail components untouched.
- Empty states: Task 2.
- Flow tests: Task 3.
- Styling: Task 4.

Placeholder scan:

- No `TBD`, `TODO`, `unknown`, `implement later`, or unspecified test steps.

Type consistency:

- Data fields match across mock data, selectors, components, and tests: `clientName`, `destination`, `travelWindow`, `departureDate`, `assignedOrganizer`, `readinessPercent`, `approvalStatus`, `riskLevel`, `nextAction`, `agentInsight`, and `status`.
