import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import ChatMessage from "../app/components/trip-dashboard/command-center/ChatMessage.jsx";
import {
  getNextPlanningContextAfterDelete,
  shouldApplyItineraryFetchResult,
  tagAssistantMessageByCompletedContent,
} from "../app/components/trip-dashboard/HomePage.jsx";

const itinerary = {
  id: "itinerary-olongapo",
  title: "2-Day Olongapo Food and Bay Route",
  summary: "A paced route with food stops, bay views, and a lighter second day.",
  days: [
    {
      id: "day-1",
      dayNumber: 1,
      title: "Subic Bay food and shoreline",
      items: [
        {
          id: "item-coco",
          title: "Lunch at Coco Lime",
          startTime: "12:00 PM",
          endTime: "1:30 PM",
          description: "Start with Filipino comfort food near the central route.",
          highlights: ["Book a table before the lunch rush", "Keep this stop close to the hotel transfer"],
          placeSnapshotId: "snap-coco",
          placeSnapshot: {
            id: "snap-coco",
            name: "Coco Lime",
            formattedAddress: "Rizal Highway, Olongapo City",
            latitude: 14.827,
            longitude: 120.285,
            rating: 4.5,
            metadata: {
              primaryPhotoUrl: "https://example.test/coco-lime.jpg",
              googleTypes: ["restaurant", "food"],
              userRatingCount: 842,
            },
          },
        },
        {
          id: "item-hellships",
          title: "Walk the Hellships Memorial",
          startTime: "2:00 PM",
          endTime: "3:00 PM",
          description: "A short reflective stop before crossing back toward the bay.",
          highlights: ["Keep the visit quiet and brief"],
          placeSnapshotId: "snap-hellships",
          placeSnapshot: {
            id: "snap-hellships",
            name: "Hellships Memorial",
            latitude: 14.821,
            longitude: 120.281,
            rating: 4.7,
            metadata: {
              photoUrls: ["https://example.test/hellships.jpg"],
              googleTypes: ["tourist_attraction"],
            },
          },
        },
      ],
    },
    {
      id: "day-2",
      dayNumber: 2,
      title: "Flexible second day",
      items: [
        {
          id: "item-unresolved",
          title: "Freeform harbor buffer",
          startTime: "10:00 AM",
          description: "Keep this open until the client confirms their ferry timing.",
          placeSnapshot: {
            id: "snap-unresolved",
            name: "Harbor buffer",
            latitude: null,
            longitude: null,
          },
        },
      ],
    },
  ],
};

const placeEntities = [
  { id: "itinerary:snap-coco", name: "Coco Lime", lat: 14.827, lng: 120.285, source: "itinerary" },
  { id: "itinerary:snap-hellships", name: "Hellships Memorial", lat: 14.821, lng: 120.281, source: "itinerary" },
];

function renderRichMessage(props = {}) {
  return render(
    <ChatMessage
      message={{ id: "assistant-rich", role: "assistant", content: "Draft created." }}
      isUser={false}
      userName="Jerald"
      userInitials="JS"
      itinerary={itinerary}
      renderAsItinerary
      placeEntities={placeEntities}
      selectedPlaceId="itinerary:snap-hellships"
      onPlaceSelect={vi.fn()}
      {...props}
    />,
  );
}

describe("rich itinerary chat message", () => {
  it("renders every itinerary stop across days with media, metadata, and readable unresolved stops", () => {
    renderRichMessage();

    expect(screen.getByRole("heading", { name: "2-Day Olongapo Food and Bay Route" })).toBeInTheDocument();
    expect(screen.getByText("A paced route with food stops, bay views, and a lighter second day.")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /day 1/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /day 2/i })).toBeInTheDocument();

    expect(screen.getByText("Lunch at Coco Lime")).toBeInTheDocument();
    expect(screen.getByText("Walk the Hellships Memorial")).toBeInTheDocument();
    expect(screen.getByText("Freeform harbor buffer")).toBeInTheDocument();
    expect(screen.getByText("10:00 AM")).toBeInTheDocument();

    expect(screen.getByRole("img", { name: /coco lime/i })).toHaveAttribute("src", "https://example.test/coco-lime.jpg");
    expect(screen.getByText(/4\.5/)).toBeInTheDocument();
    expect(screen.getByText(/Restaurant/)).toBeInTheDocument();
    expect(screen.getByText(/842 reviews/)).toBeInTheDocument();
    expect(screen.getByText("Book a table before the lunch rush")).toBeInTheDocument();

    expect(screen.queryByRole("button", { name: /select freeform harbor buffer/i })).not.toBeInTheDocument();
  });

  it("selects resolved stops and marks the selected stop as current", () => {
    const onPlaceSelect = vi.fn();
    renderRichMessage({ onPlaceSelect });

    const cocoStop = screen.getByRole("button", { name: /select lunch at coco lime/i });
    fireEvent.click(cocoStop);
    expect(onPlaceSelect).toHaveBeenCalledWith("itinerary:snap-coco");

    const selectedStop = screen.getByRole("button", { name: /select walk the hellships memorial/i });
    expect(selectedStop).toHaveAttribute("aria-current", "true");
    expect(within(selectedStop).getByText("2:00 PM - 3:00 PM")).toBeInTheDocument();
  });
});

describe("HomePage itinerary chat helpers", () => {
  it("tags matching completed assistant content from the end without tagging arbitrary older assistants", () => {
    const messages = [
      { id: "a-old", role: "assistant", content: "Older draft response" },
      { id: "user-1", role: "user", content: "Revise the plan" },
      { id: "a-new", role: "assistant", content: "New draft response" },
    ];

    expect(tagAssistantMessageByCompletedContent(messages, "itinerary-1", null)).toBe(messages);

    const tagged = tagAssistantMessageByCompletedContent(messages, "itinerary-1", {
      content: "New draft response",
    });

    expect(tagged[0]).not.toHaveProperty("itineraryId");
    expect(tagged[2]).toMatchObject({ id: "a-new", itineraryId: "itinerary-1" });
  });

  it("chooses the next planning context when deleting the active trip option", () => {
    const options = [
      { type: "trip", id: "trip-1" },
      { type: "trip", id: "trip-2" },
    ];

    expect(getNextPlanningContextAfterDelete(options, options[0])).toEqual({ type: "trip", id: "trip-2" });
    expect(getNextPlanningContextAfterDelete([options[0]], options[0])).toBeNull();
  });

  it("rejects stale itinerary fetch responses from old targets or request sequences", () => {
    expect(shouldApplyItineraryFetchResult({
      requestSequence: 2,
      latestSequence: 2,
      requestTargetKey: "draft:thread-1",
      currentTargetKey: "draft:thread-1",
    })).toBe(true);

    expect(shouldApplyItineraryFetchResult({
      requestSequence: 1,
      latestSequence: 2,
      requestTargetKey: "draft:thread-1",
      currentTargetKey: "draft:thread-1",
    })).toBe(false);

    expect(shouldApplyItineraryFetchResult({
      requestSequence: 2,
      latestSequence: 2,
      requestTargetKey: "draft:thread-1",
      currentTargetKey: "trip:trip-1",
    })).toBe(false);
  });
});
