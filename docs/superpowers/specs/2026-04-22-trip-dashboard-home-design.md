# Trip Dashboard Home Design

## Context

Voyage's current `HomePage.jsx` works as a lightweight handoff screen between login and the planning workspace. It shows the active trip, a start-new-trip card, and archived trips, but it does not help a traveler manage the itinerary directly from the home screen.

The new home experience will become a timeline-first travel dashboard. It should feel immediately useful for active trip management while preserving a small amount of destination excitement through imagery, route context, and travel-focused language.

## Goals

- Make the active itinerary the primary focus of the home screen.
- Show per-day progress with automatic progress bar updates.
- Let users complete individual locations directly from the dashboard.
- Let users mark an entire day done with a single action.
- Show overall trip progress and current trip context at a glance.
- Add a polished visual route panel without depending on live map services.
- Create a file structure that is easy to connect to backend APIs later.

## Non-Goals

- No live Google Maps integration in this phase.
- No persistence to a backend in this phase.
- No booking management, weather service, or payment features in this phase.
- No changes to the workspace editor flow beyond feeding it richer itinerary data.

## Chosen Direction

The design follows a timeline-first dashboard structure.

- A compact hero at the top shows destination, travel window, countdown, and high-level trip context.
- A summary strip shows travelers, pace, budget, and overall trip completion.
- A polished dummy map panel provides route energy and geographic context.
- The main content is a vertical itinerary timeline made of day cards.
- Each day card includes a title, status, progress bar, completion count, checklist rows for locations, and a `Mark day done` action.

This keeps the page operational first and inspirational second.

## Layout

### 1. Travel Header

The top section presents the active trip in a compact but premium format.

- Destination name is the largest visual anchor.
- Travel window appears directly under the destination.
- A derived countdown badge shows days remaining until the trip starts. If the trip date is in the past or cannot be parsed, the badge falls back to a neutral planning label.
- Supporting copy reinforces readiness and planning status rather than marketing language.

### 2. Summary Strip

A secondary summary row appears below the header.

- Travelers count
- Pace
- Budget
- Overall trip progress
- Next active day label

This row should be scannable in one glance and should use shared Voyage styling tokens.

### 3. Map Overview Panel

This panel is a styled route overview rather than a live map.

- Shows destination and highlighted districts or areas.
- Uses pins, path cues, and labels derived from itinerary or map-place data.
- Includes a short route summary such as number of active zones or highlighted stops.
- Remains secondary to the itinerary timeline.

The panel should look intentionally designed so it can later be replaced with a real map component without changing the surrounding layout.

### 4. Itinerary Timeline

The main body contains day cards in order.

Each day card contains:

- Day label
- Day title
- Completion percentage
- Horizontal progress bar
- Completed locations count out of total
- Optional supporting context such as district, rhythm, or trip note
- Checklist rows for each location
- `Mark day done` button

Completed days should be visually distinct from active or partial days.

## Interaction Model

### Per-Location Completion

Each location row contains:

- Location name
- Optional district, time, or descriptor
- A button to mark the location complete

When a location is completed:

- Its row switches to a completed state.
- The day's progress bar updates immediately.
- The day's completion count updates immediately.
- The overall trip progress updates immediately.

When a completed location is toggled back to incomplete:

- The same metrics update in reverse.

### Day Completion

Each day card includes a `Mark day done` button.

When pressed:

- All incomplete locations for that day are marked complete.
- The day becomes visually complete.
- The day progress becomes `100%`.
- The overall trip progress updates immediately.

If a day has no locations, the button is disabled and the day shows an empty-state message.

## Data Model

The existing itinerary day shape in `prototype-data.js` currently stores `stops` as strings. This will be replaced with richer location objects.

### Day shape

```js
{
  id: "day-1",
  label: "Day 1",
  title: "Arrival and settle in",
  note: "Ease into the neighborhood and keep the evening light.",
  locations: [
    {
      id: "loc-1",
      name: "Airport transfer",
      district: "Transit",
      time: "13:30",
      completed: true
    }
  ]
}
```

### Derived values

The dashboard should derive rather than store:

- Per-day completion percentage
- Per-day completed count
- Overall trip completion percentage
- Next active day
- Number of completed days

This keeps the UI deterministic and reduces future backend merge issues.

## File Structure

The implementation should shift from a flat `app/components` structure to a feature-first hierarchy that cleanly separates UI, derived logic, and future API boundaries.

```text
Voyage-Client/
  app/
    layout.jsx
    page.jsx
    globals.css

    login/
      page.jsx

    components/
      landing/
        LandingPage.jsx

      trip-dashboard/
        HomePage.jsx
        DashboardHero.jsx
        TripSummaryStrip.jsx
        MapOverviewPanel.jsx
        ItineraryTimeline.jsx
        ItineraryDayCard.jsx
        LocationChecklistRow.jsx

      workspace/
        WorkspaceScreen.jsx

      agent/
        AgentKickoffScreen.jsx

      review/
        ReviewScreen.jsx

      share/
        ShareScreen.jsx

    lib/
      trip-dashboard/
        progress.js
        selectors.js
        mappers.js

    data/
      prototype/
        trip-dashboard.js

    hooks/
      usePrototypeState.js
      useTripDashboard.js

  tests/
    landing-page.test.jsx
    home-page.test.jsx
    trip-dashboard-progress.test.jsx
    prototype-flow.test.jsx
    prototype-mobile.test.jsx
```

## Responsibility Boundaries

### `components/trip-dashboard`

Contains presentational and container UI for the home dashboard.

- `HomePage.jsx` coordinates the dashboard sections.
- `DashboardHero.jsx` renders the destination-led header.
- `TripSummaryStrip.jsx` renders derived trip metrics.
- `MapOverviewPanel.jsx` renders the polished dummy route card.
- `ItineraryTimeline.jsx` renders the ordered list of day cards.
- `ItineraryDayCard.jsx` owns the per-day presentation and action wiring.
- `LocationChecklistRow.jsx` owns the per-location toggle UI.

### `lib/trip-dashboard`

Contains pure logic and transformation utilities.

- `progress.js` computes location, day, and trip progress.
- `selectors.js` resolves the next active day and summary metrics.
- `mappers.js` converts raw backend responses into the dashboard view model once APIs are introduced.

### `hooks`

- `usePrototypeState.js` remains the top-level prototype app state holder.
- `useTripDashboard.js` becomes the dashboard interaction layer. It handles location toggles and day completion while keeping the UI components simple.

### `data/prototype`

Holds the dashboard-specific mock trip shape. This isolates demo data from general prototype constants and makes future replacement with API data straightforward.

## State Flow

`page.jsx` should continue to own the canonical prototype state. The dashboard state should not be trapped locally in a single view component.

Recommended flow:

1. `page.jsx` keeps `days` in state.
2. `HomePage.jsx` receives `days`, `tripBrief`, and action handlers as props.
3. `useTripDashboard.js` exposes:
   - `toggleLocationComplete(dayId, locationId)`
   - `markDayDone(dayId)`
   - derived summary values
4. UI components stay mostly stateless and render from props.

This makes future backend integration easier because persistence can later be added in the hook or service layer instead of rewriting the component tree.

## Future Backend Boundary

The design should support a later service layer such as:

```text
app/
  services/
    trip-dashboard/
      trips.js
```

Expected future service responsibilities:

- Fetch the dashboard payload for a trip
- Update a single location completion state
- Mark an entire day complete
- Map backend models into the UI-ready dashboard shape

This future boundary is intentionally not implemented in this phase, but the component and hook structure should assume it will exist.

## Styling Direction

The page should stay coherent with Voyage's current theme system.

- Reuse existing Voyage CSS variables and card language.
- Keep the itinerary timeline dominant.
- Use a premium but restrained travel aesthetic.
- Add motion only where it strengthens feedback, such as progress fill changes and card hover states.
- Preserve responsive behavior on tablet and mobile.

The design should avoid turning the page into either a generic analytics dashboard or a pure marketing surface.

## Error Handling and Fallbacks

- Missing destination falls back to a neutral trip label.
- Missing or invalid travel window falls back to a planning status instead of a broken countdown.
- Days with no locations render an empty itinerary message and a disabled completion action.
- Missing optional fields such as district, time, or note should not break the layout.

## Verification Requirements

Implementation is complete only if the following are true:

- Toggling a location updates the correct day progress immediately.
- Toggling a location updates overall trip progress immediately.
- `Mark day done` completes all remaining locations in the selected day.
- Completed days render a visually distinct state.
- The page remains usable on mobile widths.
- Existing navigation from home to agent kickoff still works.
- The dashboard renders gracefully with partial or missing prototype data.

## Recommendation for Implementation

Implement the file hierarchy during the dashboard build rather than as a second refactor. Even if some folders begin with only one file, the structure will reduce churn when backend work starts.
