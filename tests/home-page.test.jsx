import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import Page from "../app/page.jsx";
import { useTripDashboard } from "../app/hooks/useTripDashboard.js";

const mockState = {
  routerPush: vi.fn(),
  searchParamsAuthenticated: null,
  setActiveScreen: vi.fn(),
  setActiveWorkspaceTab: vi.fn(),
  setDays: vi.fn(),
  setSelectedDayId: vi.fn(),
  setSelectedPlaceId: vi.fn(),
  setAgentMessages: vi.fn(),
  prototypeState: null,
  workspaceProps: null,
};

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockState.routerPush,
  }),
  useSearchParams: () => ({
    get: (key) => (key === "authenticated" ? mockState.searchParamsAuthenticated : null),
  }),
}));

vi.mock("../app/hooks/usePrototypeState.js", () => ({
  usePrototypeState: () => mockState.prototypeState,
}));

vi.mock("../app/components/landing/LandingPage.jsx", () => ({
  default: () => <div data-testid="landing-page">Landing page</div>,
}));

vi.mock("../app/components/trip-dashboard/HomePage.jsx", () => ({
  default: () => <div data-testid="home-page">Home page</div>,
}));

vi.mock("../app/components/agent/AgentKickoffScreen.jsx", () => ({
  default: () => <div data-testid="agent-kickoff-screen">Agent kickoff</div>,
}));

vi.mock("../app/components/review/ReviewScreen.jsx", () => ({
  default: () => <div data-testid="review-screen">Review screen</div>,
}));

vi.mock("../app/components/share/ShareScreen.jsx", () => ({
  default: () => <div data-testid="share-screen">Share screen</div>,
}));

vi.mock("../app/components/workspace/WorkspaceScreen.jsx", () => ({
  default: (props) => {
    mockState.workspaceProps = props;
    return <div data-testid="workspace-screen">Workspace screen</div>;
  },
}));

vi.mock("../app/data/prototype/trip-dashboard.js", async () => {
  const actual = await vi.importActual("../app/data/prototype/trip-dashboard.js");

  return {
    ...actual,
    initialMapPlaces: [],
    default: {
      ...actual.default,
      mapPlaces: [],
    },
  };
});

beforeEach(() => {
  vi.clearAllMocks();
  mockState.searchParamsAuthenticated = null;
  mockState.prototypeState = null;
  mockState.workspaceProps = null;
});

const testTripBrief = {
  destination: "Barcelona, Spain",
  travelWindow: "May 12-17, 2026",
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

    expect(screen.getByText("Trip progress 0%")).toBeInTheDocument();
    expect(screen.getByText("Next day Day 1")).toBeInTheDocument();
    expect(screen.getByText("First day 0%")).toBeInTheDocument();
    expect(screen.getByText("Map highlight Airport transfer")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "toggle first stop" }));

    expect(screen.getByText("Trip progress 33%")).toBeInTheDocument();
    expect(screen.getByText("First day 50%")).toBeInTheDocument();
    expect(screen.getByText("Next day Day 1")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "finish day 2" }));

    expect(screen.getByText("Trip progress 67%")).toBeInTheDocument();
    expect(screen.getByText("First day 50%")).toBeInTheDocument();
    expect(screen.getByText("Next day Day 1")).toBeInTheDocument();
  });
});

describe("Page handoff behavior", () => {
  it("only auto-advances the login handoff when authenticated is exactly 1", async () => {
    mockState.prototypeState = {
      activeScreen: "landing",
      setActiveScreen: mockState.setActiveScreen,
      activeWorkspaceTab: "overview",
      setActiveWorkspaceTab: mockState.setActiveWorkspaceTab,
      tripBrief: testTripBrief,
      days: testDays,
      setDays: mockState.setDays,
      selectedDayId: "day-1",
      setSelectedDayId: mockState.setSelectedDayId,
      selectedPlaceId: null,
      setSelectedPlaceId: mockState.setSelectedPlaceId,
      agentMessages: [],
      setAgentMessages: mockState.setAgentMessages,
    };

    mockState.searchParamsAuthenticated = "0";
    window.localStorage.setItem("voyage-user", JSON.stringify({ id: "user-1" }));
    render(<Page />);

    expect(mockState.setActiveScreen).not.toHaveBeenCalled();

    mockState.setActiveScreen.mockClear();
    mockState.searchParamsAuthenticated = "1";
    render(<Page />);

    expect(mockState.setActiveScreen).toHaveBeenCalledWith("trip-brief");
    window.localStorage.removeItem("voyage-user");
  });

  it("keeps the selected day and map fallback safe when map places are empty", () => {
    mockState.workspaceProps = null;
    mockState.prototypeState = {
      activeScreen: "workspace",
      setActiveScreen: mockState.setActiveScreen,
      activeWorkspaceTab: "map",
      setActiveWorkspaceTab: mockState.setActiveWorkspaceTab,
      tripBrief: testTripBrief,
      days: testDays,
      setDays: mockState.setDays,
      selectedDayId: "day-missing",
      setSelectedDayId: mockState.setSelectedDayId,
      selectedPlaceId: "place-missing",
      setSelectedPlaceId: mockState.setSelectedPlaceId,
      agentMessages: [],
      setAgentMessages: mockState.setAgentMessages,
    };
    mockState.searchParamsAuthenticated = null;

    render(<Page />);

    expect(mockState.workspaceProps).not.toBeNull();
    expect(mockState.workspaceProps.selectedDayId).toBe("day-1");
    expect(mockState.workspaceProps.selectedDay?.id).toBe("day-1");
    expect(mockState.workspaceProps.selectedPlace).toBeNull();

    expect(() => mockState.workspaceProps.onTabChange("map")).not.toThrow();
    expect(mockState.setSelectedPlaceId).toHaveBeenCalledWith(null);
  });
});

describe("Trip dashboard HomePage", () => {
  it("renders the trip dashboard sections with summary and route highlights", async () => {
    const { default: HomePage } = await vi.importActual("../app/components/trip-dashboard/HomePage.jsx");

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
        tripBrief={{
          ...testTripBrief,
          travelers: 2,
          pace: "Balanced with room for slow mornings",
          budget: "Mid-range",
          priority: "Food, architecture, and a few beach hours",
        }}
        tripProgress={{
          completedCount: 1,
          totalCount: 3,
          percent: 33,
          completedDays: 0,
          totalDays: 2,
        }}
      />,
    );

    expect(screen.getByRole("heading", { name: "Barcelona, Spain" })).toBeInTheDocument();
    expect(screen.getByText("May 12-17, 2026")).toBeInTheDocument();
    expect(screen.getAllByText("33% complete")).toHaveLength(2);
    expect(screen.getByText("Next up")).toBeInTheDocument();
    expect(screen.getAllByText("Day 1: Arrival")).toHaveLength(2);
    expect(screen.getByRole("heading", { name: "Route overview" })).toBeInTheDocument();
    expect(screen.getAllByText("Airport transfer")).toHaveLength(2);
    expect(screen.getAllByText("Hotel check-in")).toHaveLength(2);
    expect(screen.getAllByText("Tapas crawl")).toHaveLength(2);
    expect(screen.getByRole("heading", { name: "Itinerary timeline" })).toBeInTheDocument();
    expect(screen.getByText("Arrival")).toBeInTheDocument();
    expect(screen.getByText("1 of 2 complete")).toBeInTheDocument();
  });

  it("wires per-location and per-day actions through the new dashboard tree", async () => {
    const { default: HomePage } = await vi.importActual("../app/components/trip-dashboard/HomePage.jsx");
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
        tripBrief={{
          ...testTripBrief,
          travelers: 2,
          pace: "Balanced",
          budget: "Mid-range",
          priority: "Food",
        }}
        tripProgress={{
          completedCount: 0,
          totalCount: 2,
          percent: 0,
          completedDays: 0,
          totalDays: 1,
        }}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Continue to agent kickoff" }));
    fireEvent.click(screen.getByRole("button", { name: "Toggle Airport transfer" }));
    fireEvent.click(screen.getByRole("button", { name: "Mark day 1 done" }));

    expect(onContinue).toHaveBeenCalledTimes(1);
    expect(onToggleLocation).toHaveBeenCalledWith("day-1", "loc-1");
    expect(onMarkDayDone).toHaveBeenCalledWith("day-1");
  });
});
