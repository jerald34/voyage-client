import { render } from "@testing-library/react";
import { waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import Page from "../app/page.jsx";

const mockState = {
  routerPush: vi.fn(),
  searchParamsAuthenticated: null,
  searchParamsTab: null,
  searchParamsInvited: null,
  setActiveScreen: vi.fn(),
  setActiveWorkspaceTab: vi.fn(),
  setDays: vi.fn(),
  setSelectedDayId: vi.fn(),
  setSelectedPlaceId: vi.fn(),
  setAgentMessages: vi.fn(),
  prototypeState: null,
  workspaceProps: null,
  homePageProps: null,
};

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockState.routerPush,
  }),
  useSearchParams: () => ({
    get: (key) => {
      if (key === "authenticated") return mockState.searchParamsAuthenticated;
      if (key === "tab") return mockState.searchParamsTab;
      if (key === "invited") return mockState.searchParamsInvited;
      return null;
    },
  }),
}));

vi.mock("../app/hooks/usePrototypeState.js", () => ({
  usePrototypeState: () => mockState.prototypeState,
}));

vi.mock("../app/components/landing/LandingPage.jsx", () => ({
  default: () => <div data-testid="landing-page">Landing page</div>,
}));

vi.mock("../app/components/trip-dashboard/HomePage.jsx", () => ({
  default: (props) => {
    mockState.homePageProps = props;
    return <div data-testid="home-page">Home page</div>;
  },
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
    default: {
      ...actual.default,
      mapPlaces: [],
    },
  };
});

const testTripBrief = {
  destination: "Barcelona, Spain",
  travelWindow: "May 12-17, 2026",
  travelers: 2,
  pace: "Balanced with room for slow mornings",
  budget: "Mid-range",
};

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

beforeEach(() => {
  vi.clearAllMocks();
  window.localStorage.clear();
  mockState.searchParamsAuthenticated = null;
  mockState.searchParamsTab = null;
  mockState.searchParamsInvited = null;
  mockState.prototypeState = null;
  mockState.workspaceProps = null;
  mockState.homePageProps = null;
});

describe("page handoff guards", () => {
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

    await waitFor(() => {
      expect(mockState.setActiveScreen).toHaveBeenCalledWith("trip-brief");
    });
  });

  it("keeps the selected day and map fallback safe when map places are empty", () => {
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

    render(<Page />);

    expect(mockState.workspaceProps).not.toBeNull();
    expect(mockState.workspaceProps.selectedDayId).toBe("day-1");
    expect(mockState.workspaceProps.selectedDay?.id).toBe("day-1");
    expect(mockState.workspaceProps.selectedPlace).toBeNull();

    expect(() => mockState.workspaceProps.onTabChange("map")).not.toThrow();
    expect(mockState.setSelectedPlaceId).toHaveBeenCalledWith(null);
  });

  it("hands accepted agency invites into the dashboard Team tab with its confirmation notice", () => {
    mockState.prototypeState = {
      activeScreen: "trip-brief",
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
    mockState.searchParamsTab = "team";
    mockState.searchParamsInvited = "1";

    render(<Page />);

    expect(mockState.homePageProps).toMatchObject({
      initialTab: "team",
      showJoinedNotice: true,
    });
  });
});
