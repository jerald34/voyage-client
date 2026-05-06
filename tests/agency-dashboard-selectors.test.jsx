import { describe, expect, it } from "vitest";

import {
  getAgencyPortfolioSummary,
  getAgentCommandInsights,
  getAgentPriorityQueue,
  getApprovalBlockers,
  getDaysUntilDeparture,
  getUrgentDepartures,
} from "../app/lib/agency-dashboard/selectors.js";

const referenceDate = new Date("2026-04-24T00:00:00+08:00");

const trips = [
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
    agentInsight: "Departure is inside 30 days and itinerary approval is still pending.",
    status: "active",
  },
  {
    id: "trip-reyes-baguio",
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
  {
    id: "trip-lim-el-nido",
    clientName: "Lim Honeymoon",
    destination: "El Nido",
    travelWindow: "July 9-14, 2026",
    departureDate: "2026-07-09",
    assignedOrganizer: "Ari",
    readinessPercent: 92,
    approvalStatus: "Approved",
    riskLevel: "Low",
    nextAction: "Open trip",
    agentInsight: "Trip is healthy and ready for final polish.",
    status: "active",
  },
  {
    id: "trip-archived-cebu",
    clientName: "Archived Client",
    destination: "Cebu",
    travelWindow: "March 1-4, 2026",
    departureDate: "2026-03-01",
    assignedOrganizer: "Mara",
    readinessPercent: 100,
    approvalStatus: "Approved",
    riskLevel: "Low",
    nextAction: "Open trip",
    agentInsight: "Archived trip.",
    status: "archived",
  },
];

function createTrip(overrides) {
  return {
    id: "trip-test",
    clientName: "Test Client",
    destination: "Olongapo City",
    travelWindow: "May 12-17, 2026",
    departureDate: "2026-05-12",
    assignedOrganizer: "Mara",
    readinessPercent: 70,
    approvalStatus: "Approved",
    riskLevel: "Low",
    nextAction: "Open trip",
    agentInsight: "Test trip.",
    status: "active",
    ...overrides,
  };
}

describe("agency dashboard selectors", () => {
  it("summarizes active portfolio health", () => {
    expect(getAgencyPortfolioSummary(trips, referenceDate)).toEqual({
      activeTrips: 3,
      departuresIn30Days: 2,
      awaitingApproval: 2,
      atRisk: 2,
    });
  });

  it("orders urgent departures by nearest departure", () => {
    expect(getUrgentDepartures(trips, referenceDate).map((trip) => trip.clientName)).toEqual([
      "Reyes Group",
      "Santos Family",
    ]);
  });

  it("adds days until departure to urgent departure results", () => {
    expect(getUrgentDepartures(trips, referenceDate)).toEqual([
      expect.objectContaining({ clientName: "Reyes Group", daysUntilDeparture: 8 }),
      expect.objectContaining({ clientName: "Santos Family", daysUntilDeparture: 18 }),
    ]);
  });

  it("treats missing status as active for summary counts", () => {
    const activeWithoutStatus = createTrip({
      id: "trip-no-status",
      clientName: "No Status Client",
      departureDate: "2026-05-10",
      approvalStatus: "Approved",
    });
    delete activeWithoutStatus.status;

    expect(getAgencyPortfolioSummary([activeWithoutStatus], referenceDate)).toEqual({
      activeTrips: 1,
      departuresIn30Days: 1,
      awaitingApproval: 0,
      atRisk: 0,
    });
  });

  it("includes urgent departures on the reference date and window boundary", () => {
    const boundaryTrips = [
      createTrip({
        id: "trip-day-0",
        clientName: "Today Client",
        departureDate: "2026-04-24",
      }),
      createTrip({
        id: "trip-day-30",
        clientName: "Boundary Client",
        departureDate: "2026-05-24",
      }),
      createTrip({
        id: "trip-day-31",
        clientName: "Outside Client",
        departureDate: "2026-05-25",
      }),
    ];

    expect(getUrgentDepartures(boundaryTrips, referenceDate).map((trip) => [trip.clientName, trip.daysUntilDeparture])).toEqual([
      ["Today Client", 0],
      ["Boundary Client", 30],
    ]);
  });

  it("excludes approved trips from approval blockers", () => {
    expect(getApprovalBlockers(trips).map((trip) => trip.approvalStatus)).toEqual([
      "Awaiting itinerary approval",
      "Final confirmation pending",
    ]);
  });

  it("treats all blocker terms as approval blockers and excludes approved trips", () => {
    const blockerTrips = [
      createTrip({ id: "trip-awaiting", approvalStatus: "Awaiting itinerary approval" }),
      createTrip({ id: "trip-pending", approvalStatus: "Final confirmation pending" }),
      createTrip({ id: "trip-requested-changes", approvalStatus: "Requested changes from client" }),
      createTrip({ id: "trip-missing", approvalStatus: "Missing passport details" }),
      createTrip({ id: "trip-needs", approvalStatus: "Needs hotel preference" }),
      createTrip({ id: "trip-approved", approvalStatus: "Approved" }),
    ];

    expect(getApprovalBlockers(blockerTrips).map((trip) => trip.approvalStatus)).toEqual([
      "Awaiting itinerary approval",
      "Final confirmation pending",
      "Requested changes from client",
      "Missing passport details",
      "Needs hotel preference",
    ]);
  });

  it("ranks the agent priority queue by urgency and readiness", () => {
    expect(getAgentPriorityQueue(trips, referenceDate).map((trip) => trip.clientName)).toEqual([
      "Reyes Group",
      "Santos Family",
      "Lim Honeymoon",
    ]);
  });

  it("adds days until departure and priority score to priority queue results", () => {
    expect(getAgentPriorityQueue(trips, referenceDate)[0]).toEqual(
      expect.objectContaining({
        clientName: "Reyes Group",
        daysUntilDeparture: 8,
        priorityScore: expect.any(Number),
      }),
    );
  });

  it("builds command insights from portfolio counts", () => {
    expect(getAgentCommandInsights(trips, referenceDate)).toEqual([
      "2 approvals blocking production",
      "2 departures inside 30 days",
      "2 trips flagged at risk",
    ]);
  });

  it("returns null for invalid departure dates", () => {
    expect(getDaysUntilDeparture("date pending", referenceDate)).toBeNull();
  });

  it("counts date-only departures using the dashboard calendar day", () => {
    expect(getDaysUntilDeparture("2026-05-12", referenceDate)).toBe(18);
    expect(getDaysUntilDeparture("2026-05-02", referenceDate)).toBe(8);
  });
});
