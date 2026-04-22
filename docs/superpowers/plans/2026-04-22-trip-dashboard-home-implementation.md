# Trip Dashboard Home Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a timeline-first trip dashboard on the home screen with per-location completion, auto-updating day progress bars, a polished dummy map panel, and a cleaner file hierarchy for future backend integration.

**Architecture:** Keep `app/page.jsx` as the top-level container and canonical state owner. Move prototype data into `app/data/prototype`, create pure trip-dashboard helpers in `app/lib/trip-dashboard`, handle dashboard mutations in `app/hooks/useTripDashboard`, and split the UI into focused components under `app/components/trip-dashboard`. Move the existing screen components into feature folders so imports match product areas instead of a flat bucket.

**Tech Stack:** Next.js App Router, React 19, Vitest, React Testing Library, global CSS in `app/globals.css`

---

## Planned File Structure

### Create

- `app/data/prototype/trip-dashboard.js`
- `app/hooks/usePrototypeState.js`
- `app/hooks/useTripDashboard.js`
- `app/lib/trip-dashboard/progress.js`
- `app/lib/trip-dashboard/selectors.js`
- `app/lib/trip-dashboard/mappers.js`
- `app/components/landing/LandingPage.jsx`
- `app/components/trip-dashboard/HomePage.jsx`
- `app/components/trip-dashboard/DashboardHero.jsx`
- `app/components/trip-dashboard/TripSummaryStrip.jsx`
- `app/components/trip-dashboard/MapOverviewPanel.jsx`
- `app/components/trip-dashboard/ItineraryTimeline.jsx`
- `app/components/trip-dashboard/ItineraryDayCard.jsx`
- `app/components/trip-dashboard/LocationChecklistRow.jsx`
- `app/components/agent/AgentKickoffScreen.jsx`
- `app/components/workspace/WorkspaceScreen.jsx`
- `app/components/review/ReviewScreen.jsx`
- `app/components/share/ShareScreen.jsx`
- `tests/home-page.test.jsx`
- `tests/trip-dashboard-progress.test.jsx`

### Modify

- `app/page.jsx`
- `app/globals.css`
- `tests/prototype-flow.test.jsx`
- `tests/prototype-mobile.test.jsx`

### Delete After Migration

- `app/prototype-data.js`
- `app/prototype-state.js`
- `app/components/LandingPage.jsx`
- `app/components/HomePage.jsx`
- `app/components/AgentKickoffScreen.jsx`
- `app/components/WorkspaceScreen.jsx`
- `app/components/ReviewScreen.jsx`
- `app/components/ShareScreen.jsx`

## File Responsibilities

- `app/data/prototype/trip-dashboard.js`: single source of prototype trip data, now using `locations` objects instead of string `stops`
- `app/lib/trip-dashboard/progress.js`: pure per-day and per-trip progress math
- `app/lib/trip-dashboard/selectors.js`: derived dashboard selectors like next active day and map highlights
- `app/lib/trip-dashboard/mappers.js`: normalize raw trip payloads into dashboard-safe shapes
- `app/hooks/usePrototypeState.js`: existing top-level prototype state hook moved into its future folder
- `app/hooks/useTripDashboard.js`: mutation callbacks and derived dashboard state
- `app/components/trip-dashboard/*`: home dashboard UI split by section
- `tests/trip-dashboard-progress.test.jsx`: pure logic regression coverage
- `tests/home-page.test.jsx`: dashboard rendering and interaction coverage

### Task 1: Build the Trip Dashboard Domain Layer

**Files:**
- Create: `app/data/prototype/trip-dashboard.js`
- Create: `app/lib/trip-dashboard/progress.js`
- Create: `app/lib/trip-dashboard/selectors.js`
- Create: `app/lib/trip-dashboard/mappers.js`
- Test: `tests/trip-dashboard-progress.test.jsx`

- [ ] **Step 1: Write the failing domain test**

```jsx
import { describe, expect, it } from "vitest";

import { getDayProgress, getTripProgress } from "../app/lib/trip-dashboard/progress.js";
import { getMapHighlights, getNextActiveDay } from "../app/lib/trip-dashboard/selectors.js";

const days = [
  {
    id: "day-1",
    label: "Day 1",
    title: "Arrival",
    locations: [
      { id: "loc-1", name: "Airport transfer", district: "Transit", completed: true },
      { id: "loc-2", name: "Hotel check-in", district: "Eixample", completed: false },
    ],
  },
  {
    id: "day-2",
    label: "Day 2",
    title: "Old city",
    locations: [{ id: "loc-3", name: "Tapas crawl", district: "Ciutat Vella", completed: false }],
  },
];

const mapPlaces = [
  { id: "place-1", name: "Airport transfer", district: "Transit", note: "Arrival route" },
  { id: "place-2", name: "Hotel check-in", district: "Eixample", note: "Drop bags first" },
  { id: "place-3", name: "Tapas crawl", district: "Ciutat Vella", note: "Evening cluster" },
];

describe("trip dashboard domain layer", () => {
  it("derives per-day progress from completed locations", () => {
    expect(getDayProgress(days[0])).toEqual({
      completedCount: 1,
      totalCount: 2,
      percent: 50,
      isComplete: false,
      isEmpty: false,
    });
  });

  it("derives overall trip progress across all days", () => {
    expect(getTripProgress(days)).toEqual({
      completedCount: 1,
      totalCount: 3,
      percent: 33,
      completedDays: 0,
      totalDays: 2,
    });
  });

  it("finds the next active day and the first three map highlights", () => {
    expect(getNextActiveDay(days)?.id).toBe("day-1");
    expect(getMapHighlights(days, mapPlaces)).toEqual([
      { label: "Transit", value: "Airport transfer" },
      { label: "Eixample", value: "Hotel check-in" },
      { label: "Ciutat Vella", value: "Tapas crawl" },
    ]);
  });
});
```

- [ ] **Step 2: Run the domain test to verify it fails**

Run: `npm test -- tests/trip-dashboard-progress.test.jsx`

Expected: FAIL with module resolution errors for `progress.js` and `selectors.js`

- [ ] **Step 3: Write the minimal domain implementation**

```js
// app/lib/trip-dashboard/progress.js
export function getDayProgress(day) {
  const locations = Array.isArray(day?.locations) ? day.locations : [];
  const totalCount = locations.length;
  const completedCount = locations.filter((location) => location.completed).length;
  const percent = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);

  return {
    completedCount,
    totalCount,
    percent,
    isComplete: totalCount > 0 && completedCount === totalCount,
    isEmpty: totalCount === 0,
  };
}

export function getTripProgress(days) {
  const safeDays = Array.isArray(days) ? days : [];
  const totals = safeDays.reduce(
    (summary, day) => {
      const progress = getDayProgress(day);
      return {
        completedCount: summary.completedCount + progress.completedCount,
        totalCount: summary.totalCount + progress.totalCount,
        completedDays: summary.completedDays + (progress.isComplete ? 1 : 0),
      };
    },
    { completedCount: 0, totalCount: 0, completedDays: 0 },
  );

  return {
    ...totals,
    percent: totals.totalCount === 0 ? 0 : Math.round((totals.completedCount / totals.totalCount) * 100),
    totalDays: safeDays.length,
  };
}
```

```js
// app/lib/trip-dashboard/selectors.js
import { getDayProgress } from "./progress.js";

export function getNextActiveDay(days) {
  const safeDays = Array.isArray(days) ? days : [];
  return safeDays.find((day) => !getDayProgress(day).isComplete) ?? safeDays[0] ?? null;
}

export function getMapHighlights(days, mapPlaces, limit = 3) {
  const placeByName = new Map((Array.isArray(mapPlaces) ? mapPlaces : []).map((place) => [place.name, place]));

  return (Array.isArray(days) ? days : [])
    .flatMap((day) => day.locations ?? [])
    .slice(0, limit)
    .map((location) => {
      const place = placeByName.get(location.name);
      return {
        label: location.district || place?.district || "Route stop",
        value: location.name,
      };
    });
}
```

```js
// app/lib/trip-dashboard/mappers.js
export function normalizeLocation(location, index) {
  return {
    id: location?.id ?? `location-${index + 1}`,
    name: location?.name ?? "Untitled stop",
    district: location?.district ?? "",
    time: location?.time ?? "",
    completed: Boolean(location?.completed),
  };
}

export function normalizeDay(day, index) {
  return {
    id: day?.id ?? `day-${index + 1}`,
    label: day?.label ?? `Day ${index + 1}`,
    title: day?.title ?? "Planning in progress",
    note: day?.note ?? "",
    locations: Array.isArray(day?.locations) ? day.locations.map(normalizeLocation) : [],
  };
}
```

```js
// app/data/prototype/trip-dashboard.js
export const prototypeWorkspaceTabs = [
  { id: "overview", label: "Overview" },
  { id: "itinerary", label: "Itinerary" },
  { id: "map", label: "Map" },
  { id: "agent", label: "Agent" },
];

export const initialTripBrief = {
  destination: "Barcelona, Spain",
  travelWindow: "May 12-17, 2026",
  travelers: 2,
  pace: "Balanced with room for slow mornings",
  budget: "Mid-range",
  priority: "Food, architecture, and a few beach hours",
};

export const initialItineraryDays = [
  {
    id: "day-1",
    label: "Day 1",
    title: "Arrival and settle in",
    note: "Keep the first evening light and walkable.",
    locations: [
      { id: "day-1-loc-1", name: "Airport transfer", district: "Transit", time: "13:30", completed: true },
      { id: "day-1-loc-2", name: "Hotel check-in", district: "Eixample", time: "15:00", completed: false },
      { id: "day-1-loc-3", name: "Late dinner in Eixample", district: "Eixample", time: "20:00", completed: false },
    ],
  },
  {
    id: "day-2",
    label: "Day 2",
    title: "Old city exploration",
    note: "Stack the walking stops close together.",
    locations: [
      { id: "day-2-loc-1", name: "Breakfast near the Gothic Quarter", district: "Ciutat Vella", time: "09:00", completed: false },
      { id: "day-2-loc-2", name: "Cathedral walk", district: "Ciutat Vella", time: "11:00", completed: false },
      { id: "day-2-loc-3", name: "Tapas crawl", district: "Ciutat Vella", time: "19:30", completed: false },
    ],
  },
  {
    id: "day-3",
    label: "Day 3",
    title: "Gaudi and seaside",
    note: "Use the beach as the late-afternoon reset point.",
    locations: [
      { id: "day-3-loc-1", name: "Sagrada Familia", district: "Eixample", time: "09:30", completed: false },
      { id: "day-3-loc-2", name: "Park Guell", district: "Gracia", time: "13:00", completed: false },
      { id: "day-3-loc-3", name: "Beach sunset", district: "Barceloneta", time: "18:30", completed: false },
    ],
  },
];

export const initialMapPlaces = [
  { id: "place-1", name: "Sagrada Familia", district: "Eixample", note: "Anchor the second full day with an early entry." },
  { id: "place-2", name: "Gothic Quarter", district: "Ciutat Vella", note: "Cluster lunch and walking stops here." },
  { id: "place-3", name: "Barceloneta Beach", district: "Barceloneta", note: "Use as the late-afternoon reset point." },
];

export const initialAgentMessages = [
  { id: "agent-1", role: "assistant", text: "I can turn a short trip brief into a day-by-day plan." },
  { id: "agent-2", role: "assistant", text: "Tell me your destination, pace, and must-see stops, and I'll organize the route." },
];

export const prototypeData = {
  workspaceTabs: prototypeWorkspaceTabs,
  tripBrief: initialTripBrief,
  itineraryDays: initialItineraryDays,
  mapPlaces: initialMapPlaces,
  agentMessages: initialAgentMessages,
};

export default prototypeData;
```

- [ ] **Step 4: Run the domain test to verify it passes**

Run: `npm test -- tests/trip-dashboard-progress.test.jsx`

Expected: PASS with 3 passing tests

- [ ] **Step 5: Commit the domain layer**

```bash
git add tests/trip-dashboard-progress.test.jsx app/data/prototype/trip-dashboard.js app/lib/trip-dashboard/progress.js app/lib/trip-dashboard/selectors.js app/lib/trip-dashboard/mappers.js
git commit -m "feat: add trip dashboard domain layer"
```

### Task 2: Add Dashboard State and Mutation Hooks

**Files:**
- Create: `app/hooks/usePrototypeState.js`
- Create: `app/hooks/useTripDashboard.js`
- Modify: `app/page.jsx`
- Test: `tests/home-page.test.jsx`

- [ ] **Step 1: Write the failing dashboard-state test**

```jsx
import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it } from "vitest";

import { useTripDashboard } from "../app/hooks/useTripDashboard.js";

const testTripBrief = {
  destination: "Barcelona, Spain",
  travelWindow: "May 12-17, 2026",
};

const testMapPlaces = [{ id: "place-1", name: "Airport transfer", district: "Transit", note: "Arrival route" }];

const testDays = [
  {
    id: "day-1",
    label: "Day 1",
    title: "Arrival",
    locations: [
      { id: "loc-1", name: "Airport transfer", district: "Transit", completed: false },
      { id: "loc-2", name: "Hotel check-in", district: "Eixample", completed: false },
    ],
  },
  {
    id: "day-2",
    label: "Day 2",
    title: "Old city",
    locations: [{ id: "loc-3", name: "Tapas crawl", district: "Ciutat Vella", completed: false }],
  },
];

function DashboardHookHarness() {
  const [days, setDays] = useState(testDays);
  const dashboard = useTripDashboard({
    days,
    setDays,
    tripBrief: testTripBrief,
    mapPlaces: testMapPlaces,
  });

  return (
    <div>
      <span>Trip progress {dashboard.tripProgress.percent}%</span>
      <span>Next day {dashboard.nextActiveDay?.label}</span>
      <button onClick={() => dashboard.toggleLocationComplete("day-1", "loc-1")}>toggle first stop</button>
      <button onClick={() => dashboard.markDayDone("day-2")}>finish day 2</button>
    </div>
  );
}

describe("useTripDashboard", () => {
  it("updates overall progress and the next active day after mutations", () => {
    render(<DashboardHookHarness />);

    expect(screen.getByText("Trip progress 0%")).toBeInTheDocument();
    expect(screen.getByText("Next day Day 1")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "toggle first stop" }));
    expect(screen.getByText("Trip progress 33%")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "finish day 2" }));
    expect(screen.getByText("Trip progress 67%")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the dashboard-state test to verify it fails**

Run: `npm test -- tests/home-page.test.jsx`

Expected: FAIL with `Cannot find module '../app/hooks/useTripDashboard.js'`

- [ ] **Step 3: Write the minimal hook and page wiring**

```js
// app/hooks/usePrototypeState.js
import { useState } from "react";

import {
  initialAgentMessages,
  initialItineraryDays,
  initialTripBrief,
  prototypeWorkspaceTabs,
} from "../data/prototype/trip-dashboard.js";

export function usePrototypeState() {
  const [activeScreen, setActiveScreen] = useState("landing");
  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState(prototypeWorkspaceTabs[0].id);
  const [tripBrief, setTripBrief] = useState(initialTripBrief);
  const [days, setDays] = useState(initialItineraryDays);
  const [selectedDayId, setSelectedDayId] = useState(initialItineraryDays[0]?.id ?? null);
  const [selectedPlaceId, setSelectedPlaceId] = useState(null);
  const [agentMessages, setAgentMessages] = useState(initialAgentMessages);

  return {
    activeScreen,
    setActiveScreen,
    activeWorkspaceTab,
    setActiveWorkspaceTab,
    tripBrief,
    setTripBrief,
    days,
    setDays,
    selectedDayId,
    setSelectedDayId,
    selectedPlaceId,
    setSelectedPlaceId,
    agentMessages,
    setAgentMessages,
  };
}
```

```js
// app/hooks/useTripDashboard.js
"use client";

import { useMemo } from "react";

import { getDayProgress, getTripProgress } from "../lib/trip-dashboard/progress.js";
import { getMapHighlights, getNextActiveDay } from "../lib/trip-dashboard/selectors.js";

export function useTripDashboard({ days, setDays, tripBrief, mapPlaces }) {
  const timelineDays = useMemo(
    () => (Array.isArray(days) ? days : []).map((day) => ({ ...day, progress: getDayProgress(day) })),
    [days],
  );

  const tripProgress = useMemo(() => getTripProgress(timelineDays), [timelineDays]);
  const nextActiveDay = useMemo(() => getNextActiveDay(timelineDays), [timelineDays]);
  const mapHighlights = useMemo(() => getMapHighlights(timelineDays, mapPlaces), [timelineDays, mapPlaces]);

  function toggleLocationComplete(dayId, locationId) {
    setDays((currentDays) =>
      currentDays.map((day) =>
        day.id !== dayId
          ? day
          : {
              ...day,
              locations: day.locations.map((location) =>
                location.id !== locationId ? location : { ...location, completed: !location.completed },
              ),
            },
      ),
    );
  }

  function markDayDone(dayId) {
    setDays((currentDays) =>
      currentDays.map((day) =>
        day.id !== dayId
          ? day
          : {
              ...day,
              locations: day.locations.map((location) => ({ ...location, completed: true })),
            },
      ),
    );
  }

  return {
    tripBrief,
    days: timelineDays,
    tripProgress,
    nextActiveDay,
    mapHighlights,
    toggleLocationComplete,
    markDayDone,
  };
}
```

```jsx
// app/page.jsx import and home wiring excerpt
import prototypeData, { initialMapPlaces } from "./data/prototype/trip-dashboard";
import { usePrototypeState } from "./hooks/usePrototypeState";
import { useTripDashboard } from "./hooks/useTripDashboard";

import LandingPage from "./components/landing/LandingPage";
import HomePage from "./components/trip-dashboard/HomePage";
import AgentKickoffScreen from "./components/agent/AgentKickoffScreen";
import WorkspaceScreen from "./components/workspace/WorkspaceScreen";
import ReviewScreen from "./components/review/ReviewScreen";
import ShareScreen from "./components/share/ShareScreen";

const dashboard = useTripDashboard({
  days,
  setDays,
  tripBrief,
  mapPlaces: initialMapPlaces,
});

const selectedDay = dashboard.days.find((day) => day.id === selectedDayId) || dashboard.days[0];
const selectedPlace = initialMapPlaces.find((place) => place.id === selectedPlaceId) || initialMapPlaces[0];

{currentScreen === "trip-brief" && (
  <HomePage
    onContinue={() => setActiveScreen("agent-kickoff")}
    tripBrief={tripBrief}
    days={dashboard.days}
    tripProgress={dashboard.tripProgress}
    nextActiveDay={dashboard.nextActiveDay}
    mapHighlights={dashboard.mapHighlights}
    onToggleLocation={dashboard.toggleLocationComplete}
    onMarkDayDone={dashboard.markDayDone}
  />
)}
```

- [ ] **Step 4: Run the dashboard-state test to verify it passes**

Run: `npm test -- tests/home-page.test.jsx`

Expected: PASS with 1 passing test

- [ ] **Step 5: Commit the hook and state migration**

```bash
git add tests/home-page.test.jsx app/hooks/usePrototypeState.js app/hooks/useTripDashboard.js app/page.jsx
git commit -m "feat: add trip dashboard state hooks"
```

### Task 3: Move Components into Feature Folders and Build the Dashboard UI

**Files:**
- Create: `app/components/landing/LandingPage.jsx`
- Create: `app/components/trip-dashboard/HomePage.jsx`
- Create: `app/components/trip-dashboard/DashboardHero.jsx`
- Create: `app/components/trip-dashboard/TripSummaryStrip.jsx`
- Create: `app/components/trip-dashboard/MapOverviewPanel.jsx`
- Create: `app/components/trip-dashboard/ItineraryTimeline.jsx`
- Create: `app/components/trip-dashboard/ItineraryDayCard.jsx`
- Create: `app/components/trip-dashboard/LocationChecklistRow.jsx`
- Create: `app/components/agent/AgentKickoffScreen.jsx`
- Create: `app/components/workspace/WorkspaceScreen.jsx`
- Create: `app/components/review/ReviewScreen.jsx`
- Create: `app/components/share/ShareScreen.jsx`
- Modify: `app/page.jsx`
- Test: `tests/home-page.test.jsx`

- [ ] **Step 1: Expand the failing dashboard UI test**

```jsx
import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import HomePage from "../app/components/trip-dashboard/HomePage.jsx";

const tripBrief = {
  destination: "Barcelona, Spain",
  travelWindow: "May 12-17, 2026",
  travelers: 2,
  pace: "Balanced with room for slow mornings",
  budget: "Mid-range",
};

const days = [
  {
    id: "day-1",
    label: "Day 1",
    title: "Arrival and settle in",
    note: "Keep the first evening light.",
    progress: { completedCount: 1, totalCount: 3, percent: 33, isComplete: false, isEmpty: false },
    locations: [
      { id: "day-1-loc-1", name: "Airport transfer", district: "Transit", time: "13:30", completed: true },
      { id: "day-1-loc-2", name: "Hotel check-in", district: "Eixample", time: "15:00", completed: false },
      { id: "day-1-loc-3", name: "Late dinner in Eixample", district: "Eixample", time: "20:00", completed: false },
    ],
  },
];

const tripProgress = { completedCount: 1, totalCount: 3, percent: 33, completedDays: 0, totalDays: 1 };
const nextActiveDay = days[0];
const mapHighlights = [
  { label: "Transit", value: "Airport transfer" },
  { label: "Eixample", value: "Hotel check-in" },
];

describe("trip dashboard home page", () => {
  it("renders the hero, route overview, and timeline actions", () => {
    render(
      <HomePage
        onContinue={vi.fn()}
        tripBrief={tripBrief}
        days={days}
        tripProgress={tripProgress}
        nextActiveDay={nextActiveDay}
        mapHighlights={mapHighlights}
        onToggleLocation={vi.fn()}
        onMarkDayDone={vi.fn()}
      />,
    );

    expect(screen.getByRole("heading", { name: "Your itinerary at a glance" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Route overview" })).toBeInTheDocument();
    expect(screen.getByText("Overall progress")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Initialize Voyage Agent" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Mark Hotel check-in done" })).toBeInTheDocument();
  });

  it("forwards checklist and day completion actions", () => {
    const onToggleLocation = vi.fn();
    const onMarkDayDone = vi.fn();

    render(
      <HomePage
        onContinue={vi.fn()}
        tripBrief={tripBrief}
        days={days}
        tripProgress={tripProgress}
        nextActiveDay={nextActiveDay}
        mapHighlights={mapHighlights}
        onToggleLocation={onToggleLocation}
        onMarkDayDone={onMarkDayDone}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Mark Hotel check-in done" }));
    expect(onToggleLocation).toHaveBeenCalledWith("day-1", "day-1-loc-2");

    const dayCard = screen.getByLabelText("Timeline day Day 1");
    fireEvent.click(within(dayCard).getByRole("button", { name: "Mark day done" }));
    expect(onMarkDayDone).toHaveBeenCalledWith("day-1");
  });
});
```

- [ ] **Step 2: Run the dashboard UI test to verify it fails**

Run: `npm test -- tests/home-page.test.jsx`

Expected: FAIL with `Cannot find module '../app/components/trip-dashboard/HomePage.jsx'`

- [ ] **Step 3: Move screens and implement the dashboard components**

```bash
git mv app/components/LandingPage.jsx app/components/landing/LandingPage.jsx
git mv app/components/AgentKickoffScreen.jsx app/components/agent/AgentKickoffScreen.jsx
git mv app/components/WorkspaceScreen.jsx app/components/workspace/WorkspaceScreen.jsx
git mv app/components/ReviewScreen.jsx app/components/review/ReviewScreen.jsx
git mv app/components/ShareScreen.jsx app/components/share/ShareScreen.jsx
git rm app/components/HomePage.jsx
```

```jsx
// app/components/trip-dashboard/LocationChecklistRow.jsx
export default function LocationChecklistRow({ dayId, location, onToggleLocation }) {
  const actionLabel = location.completed ? `Mark ${location.name} not done` : `Mark ${location.name} done`;

  return (
    <div className={`trip-location-row ${location.completed ? "is-complete" : ""}`}>
      <div>
        <strong>{location.name}</strong>
        <p>
          {[location.district, location.time].filter(Boolean).join(" • ") || "Flexible stop"}
        </p>
      </div>
      <button
        type="button"
        className={`button ${location.completed ? "button-secondary" : "button-primary"}`}
        aria-pressed={location.completed}
        onClick={() => onToggleLocation(dayId, location.id)}
      >
        {actionLabel}
      </button>
    </div>
  );
}
```

```jsx
// app/components/trip-dashboard/ItineraryDayCard.jsx
import LocationChecklistRow from "./LocationChecklistRow";

export default function ItineraryDayCard({ day, onToggleLocation, onMarkDayDone }) {
  return (
    <article className={`trip-day-card ${day.progress.isComplete ? "is-complete" : ""}`} aria-label={`Timeline day ${day.label}`}>
      <div className="trip-day-card-header">
        <div>
          <span className="frame-label">{day.label}</span>
          <h3>{day.title}</h3>
          <p>{day.note || "A focused day with route-aware planning."}</p>
        </div>
        <button type="button" className="button button-secondary" onClick={() => onMarkDayDone(day.id)} disabled={day.progress.isEmpty}>
          Mark day done
        </button>
      </div>

      <div className="trip-progress-meta">
        <strong>{day.progress.percent}% complete</strong>
        <span>{day.progress.completedCount} of {day.progress.totalCount} stops complete</span>
      </div>

      <div className="trip-progress-bar" aria-label={`Progress for ${day.label}`}>
        <span style={{ width: `${day.progress.percent}%` }} />
      </div>

      <div className="trip-location-list">
        {day.locations.length === 0 ? (
          <p className="trip-empty-state">No locations added for this day yet.</p>
        ) : (
          day.locations.map((location) => (
            <LocationChecklistRow
              key={location.id}
              dayId={day.id}
              location={location}
              onToggleLocation={onToggleLocation}
            />
          ))
        )}
      </div>
    </article>
  );
}
```

```jsx
// app/components/trip-dashboard/ItineraryTimeline.jsx
import ItineraryDayCard from "./ItineraryDayCard";

export default function ItineraryTimeline({ days, onToggleLocation, onMarkDayDone }) {
  return (
    <section className="trip-timeline-panel">
      <div className="section-heading trip-timeline-heading">
        <span className="frame-label">Trip timeline</span>
        <h2>Your trip, day by day</h2>
        <p className="lede">Update each location as you go and let Voyage track the overall trip rhythm for you.</p>
      </div>

      <div className="trip-timeline-list">
        {days.map((day) => (
          <ItineraryDayCard
            key={day.id}
            day={day}
            onToggleLocation={onToggleLocation}
            onMarkDayDone={onMarkDayDone}
          />
        ))}
      </div>
    </section>
  );
}
```

```jsx
// app/components/trip-dashboard/DashboardHero.jsx
function getCountdownLabel(travelWindow) {
  const match = travelWindow?.match(/^[A-Za-z]+ (\d+)-\d+, (\d{4})$/);
  if (!match) return "Planning in progress";

  const monthName = travelWindow.split(" ")[0];
  const startDay = Number(match[1]);
  const year = Number(match[2]);
  const startDate = new Date(`${monthName} ${startDay}, ${year}`);
  const diffMs = startDate.getTime() - Date.now();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (!Number.isFinite(diffDays) || diffDays < 0) return "Trip underway";
  return diffDays === 0 ? "Starts today" : `${diffDays} days to go`;
}

export default function DashboardHero({ tripBrief, nextActiveDay, tripProgress, onContinue }) {
  return (
    <section className="trip-dashboard-hero frame-panel">
      <div>
        <span className="frame-label">Active trip</span>
        <h1>Your itinerary at a glance</h1>
        <p className="lede">
          Keep {tripBrief?.destination || "your next trip"} moving with day-by-day progress, route context, and quick completion actions.
        </p>
      </div>
      <div className="trip-hero-summary">
        <strong>{tripBrief?.destination || "Trip in planning"}</strong>
        <p>{tripBrief?.travelWindow || "Dates to be confirmed"}</p>
        <div className="trip-hero-badges">
          <span>{getCountdownLabel(tripBrief?.travelWindow)}</span>
          <span>{tripProgress.percent}% complete</span>
          <span>{nextActiveDay?.label || "Timeline ready"}</span>
        </div>
        <button type="button" className="button button-primary" onClick={onContinue}>
          Initialize Voyage Agent
        </button>
      </div>
    </section>
  );
}
```

```jsx
// app/components/trip-dashboard/TripSummaryStrip.jsx
export default function TripSummaryStrip({ tripBrief, tripProgress, nextActiveDay }) {
  const items = [
    { label: "Travelers", value: String(tripBrief?.travelers ?? 0) },
    { label: "Pace", value: tripBrief?.pace || "Flexible" },
    { label: "Budget", value: tripBrief?.budget || "Budget pending" },
    { label: "Overall progress", value: `${tripProgress.percent}%` },
    { label: "Next active day", value: nextActiveDay?.label || "No active day" },
  ];

  return (
    <section className="trip-summary-strip">
      {items.map((item) => (
        <article key={item.label} className="trip-summary-card">
          <span className="frame-label">{item.label}</span>
          <strong>{item.value}</strong>
        </article>
      ))}
    </section>
  );
}
```

```jsx
// app/components/trip-dashboard/MapOverviewPanel.jsx
export default function MapOverviewPanel({ tripBrief, mapHighlights }) {
  return (
    <section className="trip-map-panel frame-panel">
      <div>
        <span className="frame-label">Route overview</span>
        <h2>Route overview</h2>
        <p className="lede">
          A fast visual pass across the neighborhoods shaping {tripBrief?.destination || "this trip"}.
        </p>
      </div>

      <div className="trip-map-canvas" aria-hidden="true">
        <div className="trip-map-route" />
        {mapHighlights.map((highlight, index) => (
          <div key={`${highlight.label}-${highlight.value}`} className={`trip-map-pin trip-map-pin-${index + 1}`}>
            <span>{highlight.label}</span>
            <strong>{highlight.value}</strong>
          </div>
        ))}
      </div>
    </section>
  );
}
```

```jsx
// app/components/trip-dashboard/HomePage.jsx
import DashboardHero from "./DashboardHero";
import ItineraryTimeline from "./ItineraryTimeline";
import MapOverviewPanel from "./MapOverviewPanel";
import TripSummaryStrip from "./TripSummaryStrip";

export default function HomePage({
  onContinue,
  tripBrief,
  days,
  tripProgress,
  nextActiveDay,
  mapHighlights,
  onToggleLocation,
  onMarkDayDone,
}) {
  return (
    <div className="landing-shell system-shell trip-dashboard-shell">
      <DashboardHero
        tripBrief={tripBrief}
        nextActiveDay={nextActiveDay}
        tripProgress={tripProgress}
        onContinue={onContinue}
      />

      <TripSummaryStrip
        tripBrief={tripBrief}
        tripProgress={tripProgress}
        nextActiveDay={nextActiveDay}
      />

      <MapOverviewPanel tripBrief={tripBrief} mapHighlights={mapHighlights} />

      <ItineraryTimeline
        days={days}
        onToggleLocation={onToggleLocation}
        onMarkDayDone={onMarkDayDone}
      />
    </div>
  );
}
```

```jsx
// app/components/workspace/WorkspaceScreen.jsx excerpt
{day.locations.map((location) => (
  <div key={location.id} className="activity-chip">
    <span className="chip-drag"></span>
    <span style={{ fontSize: "0.95rem" }}>{location.name}</span>
  </div>
))}
```

- [ ] **Step 4: Run the dashboard UI test to verify it passes**

Run: `npm test -- tests/home-page.test.jsx`

Expected: PASS with 2 passing tests

- [ ] **Step 5: Commit the feature-folder UI refactor**

```bash
git add app/page.jsx app/components/landing/LandingPage.jsx app/components/trip-dashboard/HomePage.jsx app/components/trip-dashboard/DashboardHero.jsx app/components/trip-dashboard/TripSummaryStrip.jsx app/components/trip-dashboard/MapOverviewPanel.jsx app/components/trip-dashboard/ItineraryTimeline.jsx app/components/trip-dashboard/ItineraryDayCard.jsx app/components/trip-dashboard/LocationChecklistRow.jsx app/components/agent/AgentKickoffScreen.jsx app/components/workspace/WorkspaceScreen.jsx app/components/review/ReviewScreen.jsx app/components/share/ShareScreen.jsx tests/home-page.test.jsx
git rm app/components/LandingPage.jsx app/components/AgentKickoffScreen.jsx app/components/WorkspaceScreen.jsx app/components/ReviewScreen.jsx app/components/ShareScreen.jsx
git commit -m "feat: build trip dashboard home page"
```

### Task 4: Style the Dashboard and Update Flow Regressions

**Files:**
- Modify: `app/globals.css`
- Modify: `tests/prototype-flow.test.jsx`
- Modify: `tests/prototype-mobile.test.jsx`

- [ ] **Step 1: Write the failing flow regression updates**

```jsx
// tests/prototype-flow.test.jsx excerpt
expect(screen.getByRole("heading", { name: "Your itinerary at a glance" })).toBeInTheDocument();
expect(screen.getByRole("heading", { name: "Route overview" })).toBeInTheDocument();
expect(screen.getByRole("button", { name: "Initialize Voyage Agent" })).toBeInTheDocument();
expect(screen.getByText("Overall progress")).toBeInTheDocument();

fireEvent.click(screen.getByRole("button", { name: "Initialize Voyage Agent" }));
expect(screen.getByRole("heading", { name: "Your copilot is ready." })).toBeInTheDocument();
```

```jsx
// tests/prototype-mobile.test.jsx excerpt
expect(screen.getByRole("heading", { name: "Your itinerary at a glance" })).toBeInTheDocument();
expect(screen.getByRole("button", { name: "Mark day done" })).toBeInTheDocument();
expect(screen.getByRole("button", { name: "Initialize Voyage Agent" })).toBeInTheDocument();
```

- [ ] **Step 2: Run the regression tests to verify they fail**

Run: `npm test -- tests/prototype-flow.test.jsx tests/prototype-mobile.test.jsx`

Expected: FAIL because the new dashboard labels and controls are not styled or fully wired yet

- [ ] **Step 3: Add the dashboard styles and finish the flow wiring**

```css
/* app/globals.css */
.trip-dashboard-shell {
  gap: 32px;
}

.trip-dashboard-hero,
.trip-map-panel,
.trip-day-card,
.trip-summary-card {
  position: relative;
  overflow: hidden;
}

.trip-dashboard-hero {
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(280px, 0.85fr);
  gap: 28px;
  padding: clamp(28px, 5vw, 40px);
  background:
    radial-gradient(circle at top left, rgba(215, 122, 97, 0.16), transparent 32%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(247, 243, 238, 0.94));
}

.trip-hero-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin: 18px 0 22px;
}

.trip-hero-badges span {
  padding: 10px 14px;
  border-radius: var(--voyage-radius-pill);
  background: rgba(255, 255, 255, 0.72);
  border: 1px solid rgba(34, 56, 67, 0.08);
  font-size: 0.86rem;
  font-weight: 700;
}

.trip-summary-strip {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 18px;
}

.trip-summary-card {
  padding: 18px 20px;
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid var(--voyage-border);
  border-radius: var(--voyage-radius-md);
  box-shadow: var(--voyage-shadow-soft);
}

.trip-map-panel {
  display: grid;
  gap: 24px;
  padding: clamp(24px, 4vw, 36px);
}

.trip-map-canvas {
  position: relative;
  min-height: 320px;
  border-radius: calc(var(--voyage-radius-lg) - 4px);
  background:
    linear-gradient(135deg, rgba(223, 230, 233, 0.85), rgba(255, 255, 255, 0.95)),
    radial-gradient(circle at top right, rgba(216, 180, 160, 0.24), transparent 32%);
  border: 1px solid rgba(34, 56, 67, 0.08);
}

.trip-map-route {
  position: absolute;
  inset: 20% 18% 18% 22%;
  border: 2px dashed rgba(215, 122, 97, 0.46);
  border-radius: 38% 62% 54% 46% / 42% 38% 62% 58%;
}

.trip-map-pin {
  position: absolute;
  display: grid;
  gap: 4px;
  padding: 12px 14px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.94);
  box-shadow: var(--voyage-shadow-soft);
  border: 1px solid rgba(34, 56, 67, 0.08);
}

.trip-map-pin-1 { top: 16%; left: 12%; }
.trip-map-pin-2 { top: 40%; right: 12%; }
.trip-map-pin-3 { bottom: 12%; left: 28%; }

.trip-timeline-list {
  display: grid;
  gap: 20px;
}

.trip-day-card {
  padding: 24px;
  background: rgba(255, 255, 255, 0.94);
  border: 1px solid var(--voyage-border);
  border-radius: var(--voyage-radius-lg);
  box-shadow: var(--voyage-shadow-soft);
}

.trip-day-card.is-complete {
  background: linear-gradient(180deg, rgba(247, 243, 238, 0.95), rgba(238, 245, 248, 0.9));
}

.trip-day-card-header {
  display: flex;
  justify-content: space-between;
  gap: 18px;
  margin-bottom: 16px;
}

.trip-progress-bar {
  width: 100%;
  height: 12px;
  margin: 10px 0 18px;
  border-radius: 999px;
  background: rgba(34, 56, 67, 0.08);
  overflow: hidden;
}

.trip-progress-bar span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, var(--voyage-secondary), #f4b183);
  transition: width 180ms ease;
}

.trip-location-list {
  display: grid;
  gap: 14px;
}

.trip-location-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 16px;
  padding: 16px;
  border-radius: var(--voyage-radius-md);
  background: rgba(255, 255, 255, 0.76);
  border: 1px solid rgba(34, 56, 67, 0.08);
}

.trip-location-row.is-complete {
  background: rgba(238, 245, 248, 0.88);
}

@media (max-width: 960px) {
  .trip-dashboard-hero,
  .trip-summary-strip {
    grid-template-columns: 1fr;
  }
}
```

- [ ] **Step 4: Run the regression tests to verify they pass**

Run: `npm test -- tests/prototype-flow.test.jsx tests/prototype-mobile.test.jsx`

Expected: PASS with all flow and mobile assertions green

- [ ] **Step 5: Commit the styles and regression coverage**

```bash
git add app/globals.css tests/prototype-flow.test.jsx tests/prototype-mobile.test.jsx
git commit -m "feat: style trip dashboard and update regressions"
```

### Task 5: Remove Legacy Files and Run Final Verification

**Files:**
- Delete: `app/prototype-data.js`
- Delete: `app/prototype-state.js`
- Modify: `app/components/workspace/WorkspaceScreen.jsx`
- Test: `tests/landing-page.test.jsx`

- [ ] **Step 1: Add the final regression guard for landing and workspace compatibility**

```jsx
// tests/landing-page.test.jsx excerpt
expect(screen.getByRole("heading", { name: "Plan smarter trips with AI, itinerary logic, and map-aware routing" })).toBeInTheDocument();
fireEvent.click(getHeroStartPlanningButton());
expect(screen.getByRole("heading", { name: "Your itinerary at a glance" })).toBeInTheDocument();
```

- [ ] **Step 2: Run the landing regression test to verify it fails if legacy imports remain**

Run: `npm test -- tests/landing-page.test.jsx`

Expected: FAIL if any import still points at the deleted flat files or old prototype modules

- [ ] **Step 3: Remove the legacy files and finish compatibility cleanup**

```jsx
// app/components/workspace/WorkspaceScreen.jsx side panel excerpt
{selectedDay.locations.map((location) => (
  <li key={location.id}>{location.name}</li>
))}
```

```bash
git rm app/prototype-data.js app/prototype-state.js
```

- [ ] **Step 4: Run the full verification suite**

Run: `npm test`
Expected: PASS with all Vitest suites green

Run: `npm run build`
Expected: PASS with a successful Next.js production build

- [ ] **Step 5: Commit the finished dashboard feature**

```bash
git add app/page.jsx app/globals.css app/hooks app/lib app/data app/components tests
git commit -m "feat: launch trip dashboard home experience"
```

## Self-Review Checklist

- Spec coverage: The plan covers the new file hierarchy, per-location completion, day completion, trip progress derivation, dummy map panel, responsive styling, and regression verification.
- Placeholder scan: No `TODO`, `TBD`, or vague "handle appropriately" steps remain.
- Type consistency: All tasks use `days[].locations[]`, `tripProgress`, `nextActiveDay`, `toggleLocationComplete(dayId, locationId)`, and `markDayDone(dayId)` consistently.
