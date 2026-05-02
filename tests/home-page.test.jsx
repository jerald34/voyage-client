import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";

import HomePage from "../app/components/trip-dashboard/HomePage.jsx";
import { useTripDashboard } from "../app/hooks/useTripDashboard.js";

const mocks = vi.hoisted(() => ({
  startStreamMock: vi.fn(),
  sendMessageMock: vi.fn(async () => ({ runId: "run-1" })),
  createAgentThreadMock: vi.fn(async (_agencyId, tripId) => ({
    thread: {
      id: `created-${tripId}`,
      tripId,
      messages: [],
      events: [],
    },
  })),
  listAgentThreadsMock: vi.fn(async () => ({
    threads: [
      { id: "thread-1", tripId: "trip-1" },
      { id: "thread-2", tripId: "trip-2" },
    ],
  })),
  fetchAgentThreadMock: vi.fn(async (_agencyId, threadId) => ({
    thread:
      threadId === "thread-2"
        ? {
            id: "thread-2",
            tripId: "trip-2",
            messages: [{ id: "m-2", role: "ASSISTANT", content: "Second thread ready" }],
            events: [{ type: "itinerary.updated", payload: { itineraryId: "itinerary-2" } }],
          }
        : {
            id: "thread-1",
            tripId: "trip-1",
            messages: [{ id: "m-1", role: "ASSISTANT", content: "First thread ready" }],
            events: [{ type: "itinerary.updated", payload: { itineraryId: "itinerary-1" } }],
          },
  })),
  fetchItineraryDraftMock: vi.fn(async (_agencyId, itineraryId) => ({
    itinerary: {
      id: itineraryId,
      version: itineraryId === "itinerary-2" ? 2 : 1,
      trip: {
        id: itineraryId === "itinerary-2" ? "trip-2" : "trip-1",
        clientName: itineraryId === "itinerary-2" ? "Reyes Group" : "Santos Family",
      },
      days: [],
    },
  })),
}));

vi.mock("../app/hooks/useAgentRunStream.js", () => ({
  useAgentRunStream: () => ({
    isStreaming: false,
    runStatus: "idle",
    assistantMessage: "",
    toolCalls: [],
    lastItineraryUpdate: null,
    error: null,
    startStream: mocks.startStreamMock,
  }),
}));

vi.mock("../app/lib/api.js", () => ({
  createAgentThread: (...args) => mocks.createAgentThreadMock(...args),
  fetchAgentThread: (...args) => mocks.fetchAgentThreadMock(...args),
  fetchItineraryDraft: (...args) => mocks.fetchItineraryDraftMock(...args),
  listAgentThreads: (...args) => mocks.listAgentThreadsMock(...args),
  sendMessage: (...args) => mocks.sendMessageMock(...args),
}));

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
  const user = {
    displayName: "Mara",
    memberships: [{ agencyId: "agency-1" }],
  };

  it("renders the Agent-centered agency portfolio dashboard", () => {
    render(<HomePage agencyTrips={agencyTrips} onContinue={vi.fn()} />);

    expect(screen.getByRole("button", { name: "Run Agency Review" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "New Itinerary" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Current client: Santos Family" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Regenerate" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Send to Client" })).toBeInTheDocument();
    expect(screen.getByText("No conversation yet")).toBeInTheDocument();
    expect(screen.getByText("Live Itinerary")).toBeInTheDocument();
  });

  it("wires Agent command actions through the homepage", () => {
    const onContinue = vi.fn();

    render(<HomePage agencyTrips={agencyTrips} onContinue={onContinue} />);

    fireEvent.click(screen.getByRole("button", { name: "Run Agency Review" }));

    expect(onContinue).toHaveBeenCalledTimes(1);
  });

  it("wires the New Itinerary button through the homepage", () => {
    const onNewItinerary = vi.fn();

    render(<HomePage agencyTrips={agencyTrips} onContinue={vi.fn()} onNewItinerary={onNewItinerary} />);

    fireEvent.click(screen.getByRole("button", { name: "New Itinerary" }));

    expect(onNewItinerary).toHaveBeenCalledTimes(1);
  });

  it("creates a no-client agent thread from New Itinerary and sends messages to it", async () => {
    const { container } = render(<HomePage user={user} agencyTrips={[]} onContinue={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: "New Itinerary" }));

    await waitFor(() => {
      expect(mocks.createAgentThreadMock).toHaveBeenCalledWith("agency-1");
    });

    fireEvent.change(screen.getByPlaceholderText("Ask the agent to adjust the draft..."), {
      target: { value: "Create a 4-day Cebu itinerary" },
    });

    fireEvent.click(container.querySelector(".send-button"));

    await waitFor(() => {
      expect(mocks.sendMessageMock).toHaveBeenCalledWith(
        "agency-1",
        "created-undefined",
        "Create a 4-day Cebu itinerary",
      );
    });
  });

  it("renders empty states for an empty portfolio", () => {
    render(<HomePage agencyTrips={[]} onContinue={vi.fn()} />);

    expect(screen.getByText("No conversation yet")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "No client trips available" }));
    expect(screen.getByRole("button", { name: "No client trips available" })).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("No client trips available");
    expect(screen.getByRole("status")).toHaveTextContent("Use New Itinerary to create the first trip.");
  });

  it("switches the active trip and thread when a client is selected", async () => {
    const { container } = render(<HomePage user={user} agencyTrips={agencyTrips} onContinue={vi.fn()} />);

    expect(await screen.findByText("First thread ready")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Santos Family/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Santos Family/i }));
    fireEvent.click(screen.getByRole("option", { name: /Reyes Group/i }));

    expect(await screen.findByText("Second thread ready")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Reyes Group/i })).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText("Ask the agent to adjust the draft..."), {
      target: { value: "Send the update" },
    });

    fireEvent.click(container.querySelector(".send-button"));

    await waitFor(() => {
      expect(mocks.sendMessageMock).toHaveBeenCalledWith("agency-1", "thread-2", "Send the update");
    });
  });
});
