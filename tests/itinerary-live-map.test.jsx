import { describe, expect, it } from "vitest";
import {
  buildDirectionsUrl,
  buildRouteEndpointPoints,
  buildRouteSegmentsFromItems,
  getMapPinGlyph,
  normalizeAgencyFallbackLocation,
  shouldFitViewportBounds,
  shouldRequestClientRoute,
  shouldShowPlannedPathFallback,
} from "../app/components/trip-dashboard/itinerary/ItineraryLiveMap.jsx";

describe("ItineraryLiveMap route segments", () => {
  it("numbers itinerary marker glyphs by stop order", () => {
    expect(getMapPinGlyph(0)).toBe("1");
    expect(getMapPinGlyph(11)).toBe("12");
  });

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

  it("hides the straight planned-path fallback when a live route exists", () => {
    expect(
      shouldShowPlannedPathFallback({
        pointCount: 3,
        routeSegmentCount: 0,
        latestRoutePointCount: 4,
      }),
    ).toBe(false);
  });

  it("requests a client-side road route before allowing a straight fallback", () => {
    expect(
      shouldRequestClientRoute({
        pointCount: 3,
        routeSegmentCount: 0,
        latestRoutePointCount: 0,
      }),
    ).toBe(true);

    expect(
      shouldShowPlannedPathFallback({
        pointCount: 3,
        routeSegmentCount: 0,
        latestRoutePointCount: 0,
        clientRouteStatus: "loading",
      }),
    ).toBe(false);

    expect(
      shouldShowPlannedPathFallback({
        pointCount: 3,
        routeSegmentCount: 0,
        latestRoutePointCount: 0,
        clientRouteStatus: "failed",
      }),
    ).toBe(false);
  });

  it("keeps the itinerary road route request active while a latest A-to-B route is visible", () => {
    expect(
      shouldRequestClientRoute({
        pointCount: 8,
        routeSegmentCount: 0,
        latestRoutePointCount: 30,
      }),
    ).toBe(true);
  });

  it("builds route endpoint markers and a Google Maps directions URL", () => {
    const route = {
      origin: { name: "Camayan Beach", lat: 14.763, lng: 120.223 },
      destination: { name: "Ocean Adventure", latitude: 14.775, longitude: 120.236 },
      travelMode: "DRIVE",
    };

    expect(buildRouteEndpointPoints(route)).toEqual([
      expect.objectContaining({ id: "route-origin", glyph: "A", name: "Camayan Beach" }),
      expect.objectContaining({ id: "route-destination", glyph: "B", name: "Ocean Adventure" }),
    ]);
    expect(buildDirectionsUrl(route)).toBe(
      "https://www.google.com/maps/dir/?api=1&origin=Camayan%20Beach&destination=Ocean%20Adventure&travelmode=driving",
    );
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
