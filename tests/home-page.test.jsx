import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";

import HomePage from "../app/components/trip-dashboard/HomePage.jsx";
import { useTripDashboard } from "../app/hooks/useTripDashboard.js";

const testTripBrief = {
  destination: "Barcelona, Spain",
  travelWindow: "May 12-17, 2026",
  travelers: 2,
  pace: "Balanced with room for slow mornings",
  budget: "Mid-range",
  priority: "Food, architecture, and a few beach hours",
};

const testMapPlaces = [
  { id: "place-1", name: "Airport transfer", district: "Transit", note: "Arrival route" },
  { id: "place-2", name: "Hotel check-in", district: "Eixample", note: "Drop bags first" },
  { id: "place-3", name: "Tapas crawl", district: "Ciutat Vella", note: "Evening cluster" },
];

const testDays = [
  {
    id: "day-1",
    label: "Day 1",
    title: "Arrival",
    note: "Ease into the city after check-in.",
    locations: [
      { id: "loc-1", name: "Airport transfer", district: "Transit", time: "13:30", completed: false },
      { id: "loc-2", name: "Hotel check-in", district: "Eixample", time: "15:00", completed: true },
    ],
  },
  {
    id: "day-2",
    label: "Day 2",
    title: "Old city",
    note: "Keep the walking route clustered.",
    locations: [{ id: "loc-3", name: "Tapas crawl", district: "Ciutat Vella", time: "19:30", completed: false }],
  },
];

function DashboardHookHarness() {
  const [days, setDays] = useState(testDays);
  const dashboard = useTripDashboard({
    days,
    setDays,
    mapPlaces: testMapPlaces,
  });

  return (
    <div>
      <p>Trip progress {dashboard.tripProgress.percent}%</p>
      <p>Next day {dashboard.nextActiveDay?.label ?? "none"}</p>
      <p>First day {dashboard.days[0].progress.percent}%</p>
      <p>Map highlight {dashboard.mapHighlights[0]?.value ?? "none"}</p>
      <button type="button" onClick={() => dashboard.toggleLocationComplete("day-1", "loc-1")}>
        toggle first stop
      </button>
      <button type="button" onClick={() => dashboard.markDayDone("day-2")}>
        finish day 2
      </button>
    </div>
  );
}

describe("useTripDashboard", () => {
  it("updates dashboard progress and derived highlights after mutations", () => {
    render(<DashboardHookHarness />);

    expect(screen.getByText("Trip progress 33%")).toBeInTheDocument();
    expect(screen.getByText("Next day Day 1")).toBeInTheDocument();
    expect(screen.getByText("First day 50%")).toBeInTheDocument();
    expect(screen.getByText("Map highlight Airport transfer")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "toggle first stop" }));

    expect(screen.getByText("Trip progress 67%")).toBeInTheDocument();
    expect(screen.getByText("First day 100%")).toBeInTheDocument();
    expect(screen.getByText("Next day Day 2")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "finish day 2" }));

    expect(screen.getByText("Trip progress 100%")).toBeInTheDocument();
    expect(screen.getByText("Next day none")).toBeInTheDocument();
  });
});

describe("Trip dashboard HomePage", () => {
  it("renders the approved dashboard headings, summary labels, and timeline actions", () => {
    render(
      <HomePage
        days={[
          {
            ...testDays[0],
            progress: {
              completedCount: 1,
              totalCount: 2,
              percent: 50,
              isComplete: false,
              isEmpty: false,
            },
          },
          {
            ...testDays[1],
            progress: {
              completedCount: 0,
              totalCount: 1,
              percent: 0,
              isComplete: false,
              isEmpty: false,
            },
          },
        ]}
        mapHighlights={[
          { label: "Transit", value: "Airport transfer" },
          { label: "Eixample", value: "Hotel check-in" },
          { label: "Ciutat Vella", value: "Tapas crawl" },
        ]}
        nextActiveDay={{ id: "day-1", label: "Day 1", title: "Arrival" }}
        onContinue={vi.fn()}
        onMarkDayDone={vi.fn()}
        onToggleLocation={vi.fn()}
        tripBrief={testTripBrief}
        tripProgress={{
          completedCount: 1,
          totalCount: 3,
          percent: 33,
          completedDays: 0,
          totalDays: 2,
        }}
      />,
    );

    expect(screen.getByRole("heading", { name: "Your itinerary at a glance" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Initialize Voyage Agent" })).toBeInTheDocument();
    expect(screen.getByText("Overall progress")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Route overview" })).toBeInTheDocument();
    expect(screen.getByLabelText("Timeline day Day 1")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Mark day done" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Mark Airport transfer done" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Mark Hotel check-in not done" })).toBeInTheDocument();
    expect(screen.getByText("A fast visual pass across the neighborhoods shaping Barcelona, Spain.")).toBeInTheDocument();
  });

  it("wires the agent kickoff, day completion, and location toggles through the dashboard tree", () => {
    const onToggleLocation = vi.fn();
    const onMarkDayDone = vi.fn();
    const onContinue = vi.fn();

    render(
      <HomePage
        days={[
          {
            ...testDays[0],
            progress: {
              completedCount: 0,
              totalCount: 2,
              percent: 0,
              isComplete: false,
              isEmpty: false,
            },
          },
        ]}
        mapHighlights={[{ label: "Transit", value: "Airport transfer" }]}
        nextActiveDay={{ id: "day-1", label: "Day 1", title: "Arrival" }}
        onContinue={onContinue}
        onMarkDayDone={onMarkDayDone}
        onToggleLocation={onToggleLocation}
        tripBrief={testTripBrief}
        tripProgress={{
          completedCount: 0,
          totalCount: 2,
          percent: 0,
          completedDays: 0,
          totalDays: 1,
        }}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Initialize Voyage Agent" }));
    fireEvent.click(screen.getByRole("button", { name: "Mark Airport transfer done" }));
    fireEvent.click(screen.getByRole("button", { name: "Mark day done" }));

    expect(onContinue).toHaveBeenCalledTimes(1);
    expect(onToggleLocation).toHaveBeenCalledWith("day-1", "loc-1");
    expect(onMarkDayDone).toHaveBeenCalledWith("day-1");
  });
});
