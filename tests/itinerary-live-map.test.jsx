import { describe, expect, it } from "vitest";
import {
  buildRouteSegmentsFromItems,
  normalizeAgencyFallbackLocation,
  shouldFitViewportBounds,
} from "../app/components/trip-dashboard/itinerary/ItineraryLiveMap.jsx";

describe("ItineraryLiveMap route segments", () => {
  it("uses per-item routeFromPrevious polylines as drawable route segments", () => {
    const segments = buildRouteSegmentsFromItems([
      {
        id: "item-1",
        placeSnapshot: { latitude: 16.411, longitude: 120.593 }
      },
      {
        id: "item-2",
        routeFromPrevious: {
          polyline: [
            { lat: 16.411, lng: 120.593 },
            { lat: 16.406, lng: 120.594 },
            { lat: 16.402, lng: 120.596 }
          ]
        },
        placeSnapshot: { latitude: 16.402, longitude: 120.596 }
      },
      {
        id: "item-3",
        routeFromPrevious: {
          polyline: []
        },
        placeSnapshot: { latitude: 16.397, longitude: 120.604 }
      }
    ]);

    expect(segments).toEqual([
      {
        id: "route-item-2",
        points: [
          { lat: 16.411, lng: 120.593 },
          { lat: 16.406, lng: 120.594 },
          { lat: 16.402, lng: 120.596 }
        ]
      }
    ]);
  });
});

describe("ItineraryLiveMap agency fallback", () => {
  it("builds a geocodable agency fallback from registration city and country", () => {
    expect(
      normalizeAgencyFallbackLocation({
        name: "Voyage Baguio",
        city: "Baguio",
        country: "Philippines",
      }),
    ).toEqual({
      id: "agency-location",
      label: "Voyage Baguio",
      query: "Baguio, Philippines",
    });
  });

  it("does not build a fallback when the agency has no registered location", () => {
    expect(normalizeAgencyFallbackLocation({ name: "Voyage" })).toBeNull();
  });

  it("does not fit bounds for a single agency fallback point", () => {
    expect(
      shouldFitViewportBounds([{ id: "agency-location", lat: 16.402, lng: 120.596 }], true),
    ).toBe(false);
  });
});
