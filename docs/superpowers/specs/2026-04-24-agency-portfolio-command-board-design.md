# Agency Portfolio Command Board Design

## Context

Voyage's current `HomePage.jsx` is a single-trip dashboard. It helps one traveler or organizer work through an itinerary timeline, route overview, and completion progress.

The next home experience should shift to an internal travel agency dashboard. Agency staff need to manage a portfolio of client trips, identify what needs attention today, and use the Voyage Agent to accelerate follow-up, readiness review, and trip production.

The future client-facing trip page will be separate. This design focuses only on the agency staff homepage.

## Goals

- Reframe `HomePage.jsx` as an agency portfolio dashboard instead of a single active-trip view.
- Make the Voyage Agent central to the page as the intelligence layer across all client trips.
- Surface upcoming departures and client approval blockers as the highest-priority homepage work.
- Show agency-wide metrics derived from portfolio data.
- Provide a ranked Agent priority queue with clear recommended actions.
- Use prototype data shaped like a future API response so the first version is useful without a backend.
- Preserve the existing single-trip itinerary/dashboard components for a later selected-trip detail workflow.

## Non-Goals

- No client-facing itinerary page in this phase.
- No backend persistence or real API integration in this phase.
- No authentication or staff permission changes in this phase.
- No full CRM, payment, booking, or document management system in this phase.
- No destructive refactor of existing trip detail components unless required for the homepage composition.

## Chosen Direction

The homepage becomes an **Agent-powered Agency Portfolio Command Board**.

The page answers:

- What did the Agent notice across our active client trips?
- Which departures are coming soon?
- Which client approvals are blocking production?
- Which trips are at risk?
- What should agency staff do next?

The Agent is not a secondary handoff step. It is the operating layer that scans the portfolio, explains risks, and recommends actions such as drafting reminders, reviewing readiness, preparing client follow-ups, or opening a trip with Agent context.

## Product Flow

```text
Agency Home
-> Agent scans active client trips
-> Agent summarizes portfolio risks and blockers
-> staff reviews agency metrics
-> staff works through the Agent priority queue
-> staff inspects urgent departures and approval blockers
-> staff opens a client trip or triggers an Agent-assisted next action
-> later, selected trips can move into the internal trip production/detail workflow
```

## Page Structure

### 1. Agency Header

The header keeps the Voyage brand but changes the context from active traveler trip to agency operations.

It should include:

- `Voyage` brand mark or text.
- Workspace label such as `Agency Portfolio`.
- Current staff identity or role summary, for example `Operations desk` or assigned organizer initials.

The header should feel compact and utilitarian.

### 2. Agent Command Center

This is the primary panel near the top of the page.

It should communicate that the Agent is actively reviewing the agency portfolio, not waiting for a single trip kickoff.

Content should include:

- Title: `Agent Command Center`.
- Short summary of what the Agent found across active trips.
- A primary action such as `Run Agency Review`.
- A secondary action such as `Prepare today's client follow-ups`.
- Insight chips or rows such as:
  - `3 approvals blocking production`
  - `2 departures inside 14 days`
  - `1 route plan needs review`

The panel should feel operational and staff-focused, not like a marketing hero.

### 3. Agency Metrics Strip

The metrics strip gives a fast portfolio health read.

Metrics should be derived from portfolio data:

- `Active trips`
- `Departures in 30 days`
- `Awaiting approval`
- `At risk`

Each metric card should show a number and a concise label. It may include a small supporting phrase when useful, but it should remain dense and scannable.

### 4. Agent Priority Queue

The Agent Priority Queue is the main working list. It combines departure urgency and approval blockers into one ranked set of recommended actions.

Each item should show:

- Client name.
- Destination.
- Reason the Agent ranked it highly.
- Departure timing or approval blocker.
- Readiness percent.
- Recommended action.
- Action button such as `Draft reminder`, `Review readiness`, or `Open trip`.

The queue should put trips with both near departures and unresolved client approvals first.

### 5. Urgent Departures Panel

This panel shows trips departing soon, ordered by departure date.

Each item should show:

- Client name.
- Destination.
- Departure date or days until departure.
- Readiness percent.
- Risk level.
- Next operational action.

If there are no urgent departures, the empty state should say:

`No departures need attention this week.`

### 6. Approval Blockers Panel

This panel shows trips blocked by client action.

Approval blocker examples:

- Awaiting itinerary approval.
- Awaiting final confirmation.
- Awaiting payment confirmation.
- Awaiting passport details.
- Awaiting hotel preference.

Each item should show:

- Client name.
- Destination.
- Approval status.
- Last client touchpoint or due date if present in mock data.
- Agent-assisted action such as `Draft reminder`.

If there are no approval blockers, the empty state should say:

`No client approvals are blocking production.`

### 7. Client Trip Portfolio

The lower section shows all active client trips as a portfolio board or dense card grid.

Each trip should show:

- Client name.
- Destination.
- Travel window.
- Assigned organizer.
- Readiness percent.
- Approval status.
- Risk level.
- Next action.
- Compact actions such as `Open trip` or an Agent-assisted action.

This section is the complete scan surface. The priority queue and panels above it are curated views derived from the same data.

## Data Model

The first version should use local prototype data shaped like a future API response.

Example trip shape:

```js
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
  agentInsight: "Departure is inside 30 days and itinerary approval is still pending."
}
```

Derived values should calculate:

- Active trip count.
- Departures inside 30 days.
- Trips awaiting approval.
- At-risk trip count.
- Urgent departures list.
- Approval blockers list.
- Agent priority queue.

The UI should not hard-code counts that can be derived from portfolio data.

## Component Direction

`HomePage.jsx` should remain the composition layer for the agency homepage.

New agency-focused components should own the major sections:

- `AgencyHero` or `AgentCommandCenter`
- `AgencyMetricStrip`
- `AgentPriorityQueue`
- `UrgentDeparturesPanel`
- `ApprovalQueuePanel`
- `ClientTripPortfolio`

The existing single-trip components can remain available for later trip detail work:

- `DashboardHero`
- `TripSummaryStrip`
- `ItineraryTimeline`
- `MapOverviewPanel`

This keeps agency home, internal trip production, and future client view as separate experiences.

## Visual Direction

The page should feel like a professional agency operations dashboard:

- Dense but readable.
- Calm and practical.
- Premium travel operations tone.
- No landing-page hero treatment.
- No oversized marketing copy.
- No decorative blobs or ornamental background elements.
- Use the existing Voyage design tokens where they fit.
- Keep cards at modest radii and use status pills, progress bars, and compact action buttons.

The Agent Command Center should be visually prominent without overwhelming the portfolio work below it.

## Interaction Model

The first implementation can keep actions local and prototype-safe.

Expected action behavior:

- `Run Agency Review` can remain a non-persistent prototype action or route to the existing Agent kickoff screen if the current flow requires it.
- `Prepare today's client follow-ups` can be presented as an Agent command button without backend execution.
- `Draft reminder`, `Review readiness`, and `Open trip` can be buttons that establish the intended workflow without sending real messages.

If routing is added, `Open trip` should eventually lead to the internal trip production/detail page for that client trip.

## Empty and Edge States

The homepage should handle missing or empty portfolio data.

- If there are no active trips, show an agency empty state explaining that imported or created client trips will appear here.
- If there are no urgent departures, show the urgent departures empty state.
- If there are no approval blockers, show the approval blockers empty state.
- If a trip is missing optional fields, use clear fallbacks such as `Organizer unassigned`, `Approval not requested`, or `Next action pending`.

## Testing Direction

Tests should verify:

- `HomePage` renders agency dashboard language instead of single-traveler itinerary language.
- The Agent Command Center is visible and includes portfolio-level insights.
- Metrics are derived from portfolio mock data.
- Urgent departures are ordered by departure date.
- Approval blockers render from approval-related statuses.
- Agent priority queue ranks trips with near departures and approval blockers before lower-risk trips.
- Empty states render when urgent departures, approval blockers, or portfolio trips are absent.

## Implementation Boundary

The first implementation should focus on the agency homepage and supporting mock data/selectors.

It should not build the future client-facing page. It should leave the current itinerary and map components intact unless a minimal integration is needed for navigation or tests.
