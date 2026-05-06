import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useState } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import HomePage from "../app/components/trip-dashboard/HomePage.jsx";
import { useTripDashboard } from "../app/hooks/useTripDashboard.js";

const mocks = vi.hoisted(() => ({
  startStreamMock: vi.fn(),
  streamState: {
    isStreaming: false,
    runStatus: "idle",
    assistantMessage: "",
    toolCalls: [],
    mapMarkers: [],
    routeEstimates: [],
    activeToolLabel: null,
    lastItineraryUpdate: null,
    lastCompletedItineraryTool: null,
    error: null,
  },
  sendMessageMock: vi.fn(async () => ({ runId: "run-1" })),
  createAgentThreadMock: vi.fn(),
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
  approveAgentThreadItineraryMock: vi.fn(async (_agencyId, threadId, payload) => ({
    thread: {
      id: threadId,
      title: payload.clientName,
      tripId: "trip-approved-1",
      messages: [],
      events: [],
    },
    trip: {
      id: "trip-approved-1",
      clientName: payload.clientName,
      destination: payload.destination,
      destinationSummary: payload.destination,
      travelerCount: payload.travelerCount ?? null,
      budgetLevel: payload.budgetLevel ?? null,
    },
    itinerary: {
      id: payload.itineraryId,
      version: 1,
      status: "DRAFT",
    },
  })),
}));

function resetApiMocks() {
  mocks.startStreamMock.mockClear();
  Object.assign(mocks.streamState, {
    isStreaming: false,
    runStatus: "idle",
    assistantMessage: "",
    toolCalls: [],
    mapMarkers: [],
    routeEstimates: [],
    activeToolLabel: null,
    lastItineraryUpdate: null,
    lastCompletedItineraryTool: null,
    error: null,
  });
  mocks.sendMessageMock.mockReset();
  mocks.sendMessageMock.mockImplementation(async () => ({ runId: "run-1" }));
  mocks.createAgentThreadMock.mockReset();
  mocks.createAgentThreadMock.mockImplementation(async (_agencyId, tripId) => ({
    thread: {
      id: tripId ? `created-${tripId}` : "created-draft",
      title: tripId ? `Trip ${tripId}` : "Planning draft",
      tripId,
      messages: [],
      events: [],
    },
  }));
  mocks.listAgentThreadsMock.mockReset();
  mocks.listAgentThreadsMock.mockImplementation(async () => ({
    threads: [
      { id: "thread-1", tripId: "trip-1" },
      { id: "thread-2", tripId: "trip-2" },
    ],
  }));
  mocks.fetchAgentThreadMock.mockReset();
  mocks.fetchAgentThreadMock.mockImplementation(async (_agencyId, threadId) => ({
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
  }));
  mocks.fetchItineraryDraftMock.mockReset();
  mocks.fetchItineraryDraftMock.mockImplementation(async (_agencyId, itineraryId) => ({
    itinerary: {
      id: itineraryId,
      version: itineraryId === "itinerary-2" ? 2 : 1,
      trip: {
        id: itineraryId === "itinerary-2" ? "trip-2" : "trip-1",
        clientName: itineraryId === "itinerary-2" ? "Reyes Group" : "Santos Family",
      },
      days: [],
    },
  }));
  mocks.approveAgentThreadItineraryMock.mockReset();
  mocks.approveAgentThreadItineraryMock.mockImplementation(async (_agencyId, threadId, payload) => ({
    thread: {
      id: threadId,
      title: payload.clientName,
      tripId: "trip-approved-1",
      messages: [],
      events: [],
    },
    trip: {
      id: "trip-approved-1",
      clientName: payload.clientName,
      destination: payload.destination,
      destinationSummary: payload.destination,
      travelerCount: payload.travelerCount ?? null,
      budgetLevel: payload.budgetLevel ?? null,
    },
    itinerary: {
      id: payload.itineraryId,
      version: 1,
      status: "DRAFT",
    },
  }));
}

vi.mock("../app/hooks/useAgentRunStream.js", () => ({
  useAgentRunStream: () => ({
    ...mocks.streamState,
    startStream: mocks.startStreamMock,
  }),
}));

vi.mock("../app/hooks/useAuth.js", () => ({
  useAuth: () => ({
    logout: vi.fn(),
    user: null,
  }),
}));

vi.mock("../app/lib/api.js", () => ({
  approveAgentThreadItinerary: (...args) => mocks.approveAgentThreadItineraryMock(...args),
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
  beforeEach(() => {
    resetApiMocks();
  });

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

  beforeEach(() => {
    resetApiMocks();
  });

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
        "created-draft",
        "Create a 4-day Cebu itinerary",
      );
    });
  });

  it("creates and adds a new draft option for each New Itinerary click", async () => {
    mocks.createAgentThreadMock
      .mockResolvedValueOnce({
        thread: { id: "draft-thread-1", title: "Draft itinerary 1", tripId: null, messages: [], events: [] },
      })
      .mockResolvedValueOnce({
        thread: { id: "draft-thread-2", title: "Draft itinerary 2", tripId: null, messages: [], events: [] },
      });

    render(<HomePage user={user} agencyTrips={agencyTrips} onContinue={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: "New Itinerary" }));

    await waitFor(() => {
      expect(mocks.createAgentThreadMock).toHaveBeenCalledWith("agency-1");
    });

    expect(screen.getByRole("button", { name: "Current client: Draft itinerary 1" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "New Itinerary" }));

    await waitFor(() => {
      expect(mocks.createAgentThreadMock).toHaveBeenCalledTimes(2);
    });

    expect(screen.getByRole("button", { name: "Current client: Draft itinerary 2" })).toBeInTheDocument();
    expect(mocks.createAgentThreadMock).toHaveBeenNthCalledWith(1, "agency-1");
    expect(mocks.createAgentThreadMock).toHaveBeenNthCalledWith(2, "agency-1");
  });

  it("shows existing no-client draft threads in the dropdown after initial load", async () => {
    mocks.listAgentThreadsMock.mockResolvedValue({
      threads: [
        { id: "draft-refresh", tripId: null },
        { id: "thread-1", tripId: "trip-1" },
      ],
    });
    mocks.fetchAgentThreadMock.mockImplementation(async (_agencyId, threadId) => ({
      thread:
        threadId === "draft-refresh"
          ? {
              id: "draft-refresh",
              title: "Refresh draft",
              tripId: null,
              messages: [{ id: "draft-message", role: "ASSISTANT", content: "Refresh draft ready" }],
              events: [{ type: "itinerary.updated", payload: { itineraryId: "draft-itinerary" } }],
            }
          : {
              id: "thread-1",
              tripId: "trip-1",
              messages: [{ id: "m-1", role: "ASSISTANT", content: "First thread ready" }],
              events: [{ type: "itinerary.updated", payload: { itineraryId: "itinerary-1" } }],
            },
    }));

    render(<HomePage user={user} agencyTrips={agencyTrips} onContinue={vi.fn()} />);

    await waitFor(() => {
      expect(mocks.fetchAgentThreadMock).toHaveBeenCalledWith("agency-1", "draft-refresh");
    });
    expect(mocks.fetchItineraryDraftMock).toHaveBeenCalledWith("agency-1", "draft-itinerary");

    fireEvent.click(screen.getByRole("button", { name: /Santos Family/i }));
    expect(screen.getByRole("option", { name: /Refresh draft/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("option", { name: /Refresh draft/i }));
    expect(await screen.findByText("Refresh draft ready")).toBeInTheDocument();
  });

  it("ignores rapid New Itinerary clicks while draft creation is pending", async () => {
    let resolveCreate;
    const pendingCreate = new Promise((resolve) => {
      resolveCreate = resolve;
    });
    mocks.createAgentThreadMock.mockReturnValue(pendingCreate);

    render(<HomePage user={user} agencyTrips={agencyTrips} onContinue={vi.fn()} />);

    const newItineraryButton = screen.getByRole("button", { name: "New Itinerary" });
    fireEvent.click(newItineraryButton);
    fireEvent.click(newItineraryButton);

    expect(mocks.createAgentThreadMock).toHaveBeenCalledTimes(1);
    await waitFor(() => {
      expect(newItineraryButton).toBeDisabled();
    });

    resolveCreate({
      thread: { id: "draft-thread-pending", title: "Pending draft", tripId: null, messages: [], events: [] },
    });

    expect(await screen.findByRole("button", { name: "Current client: Pending draft" })).toBeInTheDocument();
  });

  it("keeps both draft options in the current client dropdown after two New Itinerary clicks", async () => {
    mocks.createAgentThreadMock
      .mockResolvedValueOnce({
        thread: { id: "draft-thread-1", title: "Draft itinerary 1", tripId: null, messages: [], events: [] },
      })
      .mockResolvedValueOnce({
        thread: { id: "draft-thread-2", title: "Draft itinerary 2", tripId: null, messages: [], events: [] },
      });

    render(<HomePage user={user} agencyTrips={agencyTrips} onContinue={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: "New Itinerary" }));
    await screen.findByRole("button", { name: "Current client: Draft itinerary 1" });

    fireEvent.click(screen.getByRole("button", { name: "New Itinerary" }));
    await screen.findByRole("button", { name: "Current client: Draft itinerary 2" });

    fireEvent.click(screen.getByRole("button", { name: "Current client: Draft itinerary 2" }));

    expect(screen.getByRole("option", { name: /Draft itinerary 2/i })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: /Draft itinerary 1/i })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: /Santos Family/i })).toBeInTheDocument();
  });

  it("sends messages through the selected draft thread", async () => {
    mocks.createAgentThreadMock
      .mockResolvedValueOnce({
        thread: { id: "draft-thread-1", title: "Draft itinerary 1", tripId: null, messages: [], events: [] },
      })
      .mockResolvedValueOnce({
        thread: { id: "draft-thread-2", title: "Draft itinerary 2", tripId: null, messages: [], events: [] },
      });

    const { container } = render(<HomePage user={user} agencyTrips={agencyTrips} onContinue={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: "New Itinerary" }));
    await screen.findByRole("button", { name: "Current client: Draft itinerary 1" });

    fireEvent.click(screen.getByRole("button", { name: "New Itinerary" }));
    await screen.findByRole("button", { name: "Current client: Draft itinerary 2" });

    fireEvent.click(screen.getByRole("button", { name: "Current client: Draft itinerary 2" }));
    fireEvent.click(screen.getByRole("option", { name: /Draft itinerary 1/i }));

    fireEvent.change(screen.getByPlaceholderText("Ask the agent to adjust the draft..."), {
      target: { value: "Plan the selected draft" },
    });

    fireEvent.click(container.querySelector(".send-button"));

    await waitFor(() => {
      expect(mocks.sendMessageMock).toHaveBeenCalledWith("agency-1", "draft-thread-1", "Plan the selected draft");
    });
  });

  it("hides live stream output when the selected planning context changes", async () => {
    mocks.createAgentThreadMock.mockResolvedValue({
      thread: { id: "draft-thread-1", title: "Draft itinerary 1", tripId: null, messages: [], events: [] },
    });

    const { container } = render(<HomePage user={user} agencyTrips={agencyTrips} onContinue={vi.fn()} />);

    await screen.findByText("First thread ready");
    fireEvent.change(screen.getByPlaceholderText("Ask the agent to adjust the draft..."), {
      target: { value: "Update Santos plan" },
    });
    fireEvent.click(container.querySelector(".send-button"));

    await waitFor(() => {
      expect(mocks.startStreamMock).toHaveBeenCalledWith("run-1");
    });

    Object.assign(mocks.streamState, {
      isStreaming: true,
      runStatus: "in_progress",
      assistantMessage: "Streaming Santos answer",
      toolCalls: [{ name: "map_pinpoint" }],
      activeToolLabel: "Pinpointing map stops",
      mapMarkers: [{ id: "marker-1", name: "Live marker" }],
      routeEstimates: [{ distanceMeters: 1200, durationSeconds: 900 }],
    });

    fireEvent.click(screen.getByRole("button", { name: "New Itinerary" }));
    await screen.findByRole("button", { name: "Current client: Draft itinerary 1" });

    expect(screen.queryByText("Streaming Santos answer")).not.toBeInTheDocument();
    expect(screen.queryByText("Agent working")).not.toBeInTheDocument();
    expect(screen.queryByText("1 live markers")).not.toBeInTheDocument();
  });

  it("approves a draft itinerary and renames the selector option to the client name", async () => {
    mocks.createAgentThreadMock.mockResolvedValue({
      thread: {
        id: "draft-thread-1",
        title: "Draft itinerary 1",
        tripId: null,
        messages: [],
        events: [{ type: "itinerary.updated", payload: { itineraryId: "itinerary-1" } }],
      },
    });

    render(<HomePage user={user} agencyTrips={agencyTrips} onContinue={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: "New Itinerary" }));
    await screen.findByRole("button", { name: "Current client: Draft itinerary 1" });

    fireEvent.click(screen.getByRole("button", { name: "Save to Client" }));
    fireEvent.change(screen.getByLabelText("Client name"), { target: { value: "Garcia Family" } });
    fireEvent.change(screen.getByLabelText("Destination"), { target: { value: "Olongapo City" } });
    fireEvent.click(screen.getByRole("button", { name: "Save client plan" }));

    await waitFor(() => {
      expect(mocks.approveAgentThreadItineraryMock).toHaveBeenCalledWith("agency-1", "draft-thread-1", {
        itineraryId: "itinerary-1",
        clientName: "Garcia Family",
        destination: "Olongapo City",
        startDate: null,
        endDate: null,
        travelerCount: undefined,
        budgetLevel: undefined,
      });
    });
    expect(await screen.findByRole("button", { name: "Current client: Garcia Family" })).toBeInTheDocument();
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
