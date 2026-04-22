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

vi.mock("../app/components/LandingPage", () => ({
  default: () => <div data-testid="landing-page">Landing page</div>,
}));

vi.mock("../app/components/HomePage", () => ({
  default: () => <div data-testid="home-page">Home page</div>,
}));

vi.mock("../app/components/AgentKickoffScreen", () => ({
  default: () => <div data-testid="agent-kickoff-screen">Agent kickoff</div>,
}));

vi.mock("../app/components/ReviewScreen", () => ({
  default: () => <div data-testid="review-screen">Review screen</div>,
}));

vi.mock("../app/components/ShareScreen", () => ({
  default: () => <div data-testid="share-screen">Share screen</div>,
}));

vi.mock("../app/components/WorkspaceScreen", () => ({
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
