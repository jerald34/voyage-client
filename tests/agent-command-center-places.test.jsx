import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import ChatMessage from "../app/components/trip-dashboard/command-center/ChatMessage.jsx";

const placeEntities = [
  {
    id: "itinerary:item-1",
    name: "Coco Lime",
    formattedAddress: "Rizal Highway, Olongapo City",
    lat: 14.827,
    lng: 120.285,
    dayLabel: "Day 1",
    timeLabel: "12:00 PM - 1:30 PM",
    source: "itinerary",
  },
];

describe("AgentCommandCenter place interactions", () => {
  it("renders resolved assistant place mentions as clickable controls and compact cards", () => {
    const onPlaceSelect = vi.fn();

    render(
      <ChatMessage
        message={{
          id: "assistant-1",
          role: "assistant",
          content: "Lunch at Coco Lime keeps the route close to Subic Bay.",
        }}
        isUser={false}
        userName="Jerald"
        userInitials="JS"
        placeEntities={placeEntities}
        selectedPlaceId=""
        onPlaceSelect={onPlaceSelect}
      />,
    );

    const inlinePlace = screen.getByRole("button", { name: /show coco lime on map/i });
    fireEvent.click(inlinePlace);

    expect(onPlaceSelect).toHaveBeenCalledWith("itinerary:item-1");

    const placeCard = screen.getByRole("button", { name: /focus coco lime on map/i });
    expect(within(placeCard).getByText("Rizal Highway, Olongapo City")).toBeInTheDocument();
    expect(within(placeCard).getByText("Day 1")).toBeInTheDocument();
  });

  it("does not stringify linked markdown children as object text", () => {
    render(
      <ChatMessage
        message={{
          id: "assistant-2",
          role: "assistant",
          content: [
            'The itinerary draft for your "1-Day Olongapo City Itinerary" has been created.',
            "",
            "- **Coco Lime** keeps lunch close to Subic Bay.",
            "- Visit Coco Lime again for dessert."
          ].join("\n"),
        }}
        isUser={false}
        userName="Jerald"
        userInitials="JS"
        placeEntities={placeEntities}
        selectedPlaceId=""
        onPlaceSelect={vi.fn()}
      />,
    );

    expect(screen.queryByText(/\[object Object\]/)).not.toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /show coco lime on map/i })).toHaveLength(2);
  });

  it("does not place-link user messages", () => {
    render(
      <ChatMessage
        message={{
          id: "user-1",
          role: "user",
          content: "Can we replace Coco Lime?",
        }}
        isUser
        userName="Jerald"
        userInitials="JS"
        placeEntities={placeEntities}
        selectedPlaceId=""
        onPlaceSelect={vi.fn()}
      />,
    );

    expect(screen.queryByRole("button", { name: /show coco lime on map/i })).not.toBeInTheDocument();
    expect(screen.getByText("Can we replace Coco Lime?")).toBeInTheDocument();
  });
});
