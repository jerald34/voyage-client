import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";

import HomePage from "../app/components/trip-dashboard/HomePage.jsx";
import { useTripDashboard } from "../app/hooks/useTripDashboard.js";

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

  it("renders the Agent-centered agency portfolio dashboard", () => {
    render(<HomePage agencyTrips={agencyTrips} onContinue={vi.fn()} />);

    expect(screen.getByText("Agency Portfolio")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Agent Command Center" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Agent Command Center" }).closest(".agency-agent-panel")).not.toBeNull();
    expect(screen.getByLabelText("Agency portfolio metrics")).toHaveClass("agency-metric-strip");
    expect(screen.getByRole("button", { name: "Run Agency Review" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Prepare today's client follow-ups" })).toBeInTheDocument();
    expect(screen.getByText("2 approvals blocking production")).toBeInTheDocument();
    expect(screen.getByText("Active trips")).toBeInTheDocument();
    expect(screen.getByText("Departures in 30 days")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Priority Queue" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Urgent Departures" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Approval Blockers" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Client Trip Portfolio" })).toBeInTheDocument();
    expect(screen.getAllByText("Santos Family").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Olongapo City").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Ready 68%").length).toBeGreaterThan(0);
  });

  it("wires Agent command actions through the homepage", () => {
    const onContinue = vi.fn();

    render(<HomePage agencyTrips={agencyTrips} onContinue={onContinue} />);

    fireEvent.click(screen.getByRole("button", { name: "Run Agency Review" }));

    expect(onContinue).toHaveBeenCalledTimes(1);
  });

  it("renders empty states for an empty portfolio", () => {
    render(<HomePage agencyTrips={[]} onContinue={vi.fn()} />);

    expect(screen.getAllByText("No active client trips yet.").length).toBeGreaterThan(0);
    expect(screen.getByText("No departures need attention this week.")).toBeInTheDocument();
    expect(screen.getByText("No client approvals are blocking production.")).toBeInTheDocument();
  });
});
