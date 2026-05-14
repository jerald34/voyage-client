"use client";

import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import {
  APIProvider,
  Map,
  useMap,
  AdvancedMarker,
  Pin,
  InfoWindow,
  useMapsLibrary,
} from "@vis.gl/react-google-maps";
import { getReadablePlaceType } from "../../../lib/trip-dashboard/richItinerary.js";
import { getGoogleMapsPlaceUrl } from "../../../lib/trip-dashboard/placeEntities.js";

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";
const MAP_ID = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID || "a1950eb4eae71842fa9590f9";

const EMPTY_MAP_CENTER = { lat: 0, lng: 0 };

export function normalizeAgencyFallbackLocation(agencyLocation) {
  if (!agencyLocation) return null;

  const city = String(agencyLocation.city ?? "").trim();
  const country = String(agencyLocation.country ?? "").trim();
  const query = [city, country].filter(Boolean).join(", ");
  if (!query) return null;

  const label = String(agencyLocation.name ?? "").trim() || query;
  const rawLat = Number(agencyLocation.lat ?? agencyLocation.latitude);
  const rawLng = Number(agencyLocation.lng ?? agencyLocation.longitude);

  return {
    id: "agency-location",
    label,
    query,
    ...(Number.isFinite(rawLat) && Number.isFinite(rawLng) ? { lat: rawLat, lng: rawLng } : {}),
  };
}

function mapItemToPoint(item, index) {
  const snapshot = item?.placeSnapshot ?? null;
  const rawLat = Number(item?.lat ?? item?.latitude ?? item?.placeSnapshot?.latitude);
  const rawLng = Number(item?.lng ?? item?.longitude ?? item?.placeSnapshot?.longitude);
  if (Number.isFinite(rawLat) && Number.isFinite(rawLng)) {
    const rating = snapshot?.rating ?? snapshot?.metadata?.rating ?? null;
    const userRatingCount = Number(snapshot?.metadata?.userRatingCount);
    return {
      id: item?.__placeEntityId || `point-${index}`,
      lat: rawLat,
      lng: rawLng,
      title: snapshot?.name || item?.placeName || item?.title || `Itinerary item ${index + 1}`,
      description: item?.description || snapshot?.formattedAddress || item?.type || "",
      formattedAddress: snapshot?.formattedAddress || "",
      placeType: getReadablePlaceType(snapshot) || item?.type || "",
      rating: rating ? String(rating) : "",
      userRatingCount: Number.isFinite(userRatingCount) ? userRatingCount : null,
      dayLabel: item?.__dayNumber ? `Day ${item.__dayNumber}` : "",
      timeLabel: item?.startTime && item?.endTime ? `${item.startTime} - ${item.endTime}` : item?.startTime || "",
    };
  }

  return null;
}

function normalizeLiveMarker(marker, index) {
  const rawLat = Number(marker?.lat ?? marker?.latitude);
  const rawLng = Number(marker?.lng ?? marker?.longitude);

  if (!Number.isFinite(rawLat) || !Number.isFinite(rawLng)) {
    return null;
  }

  return {
    id: `live:${marker?.id || marker?.placeSnapshotId || `live-marker-${index}`}`,
    name: marker?.name || marker?.formattedAddress || marker?.address || `Resolved location ${index + 1}`,
    formattedAddress: marker?.formattedAddress || marker?.address || "",
    lat: rawLat,
    lng: rawLng,
  };
}

export function getMapPinGlyph(index) {
  return String(index + 1);
}

function getRouteCoordinate(point) {
  const lat = Number(point?.lat ?? point?.latitude);
  const lng = Number(point?.lng ?? point?.longitude);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null;
  }

  return { lat, lng };
}

function getRoutePointLabel(point, fallback) {
  return String(point?.name || point?.title || point?.formattedAddress || point?.address || fallback).trim();
}

function getRoutePointQuery(point) {
  const label = getRoutePointLabel(point, "");
  if (label) return label;

  const coordinate = getRouteCoordinate(point);
  return coordinate ? `${coordinate.lat},${coordinate.lng}` : "";
}

export function buildRouteEndpointPoints(route) {
  const originCoordinate = getRouteCoordinate(route?.origin);
  const destinationCoordinate = getRouteCoordinate(route?.destination);

  if (!originCoordinate || !destinationCoordinate) {
    return [];
  }

  return [
    {
      id: "route-origin",
      glyph: "A",
      ...originCoordinate,
      name: getRoutePointLabel(route.origin, "Point A"),
      title: getRoutePointLabel(route.origin, "Point A"),
      formattedAddress: route.origin?.formattedAddress || route.origin?.address || "",
      source: "route",
    },
    {
      id: "route-destination",
      glyph: "B",
      ...destinationCoordinate,
      name: getRoutePointLabel(route.destination, "Point B"),
      title: getRoutePointLabel(route.destination, "Point B"),
      formattedAddress: route.destination?.formattedAddress || route.destination?.address || "",
      source: "route",
    },
  ];
}

function routeTravelModeForMaps(value) {
  const mode = String(value || "").toUpperCase();
  if (mode === "WALK") return "walking";
  if (mode === "BICYCLE") return "bicycling";
  if (mode === "TRANSIT") return "transit";
  return "driving";
}

export function buildDirectionsUrl(route) {
  const origin = getRoutePointQuery(route?.origin);
  const destination = getRoutePointQuery(route?.destination);

  if (!origin || !destination) {
    return "";
  }

  return `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&travelmode=${routeTravelModeForMaps(route?.travelMode)}`;
}

function decodeEncodedPolyline(polyline) {
  const coordinates = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < polyline.length) {
    let shift = 0;
    let result = 0;
    let byte;

    do {
      byte = polyline.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    const deltaLat = (result & 1) ? ~(result >> 1) : (result >> 1);
    lat += deltaLat;

    shift = 0;
    result = 0;

    do {
      byte = polyline.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    const deltaLng = (result & 1) ? ~(result >> 1) : (result >> 1);
    lng += deltaLng;

    coordinates.push({ lat: lat / 1e5, lng: lng / 1e5 });
  }

  return coordinates;
}

export function normalizeRoutePolyline(polyline) {
  if (!polyline) return [];

  if (typeof polyline === "string") {
    return decodeEncodedPolyline(polyline);
  }

  if (polyline && typeof polyline === "object" && !Array.isArray(polyline)) {
    const nestedPolyline =
      polyline.coordinates ??
      polyline.points ??
      polyline.path ??
      polyline.geometry?.coordinates ??
      null;

    if (nestedPolyline) {
      return normalizeRoutePolyline(nestedPolyline);
    }
  }

  if (!Array.isArray(polyline)) return [];

  return polyline
    .map((point) => {
      if (Array.isArray(point) && point.length >= 2) {
        const first = Number(point[0]);
        const second = Number(point[1]);
        if (Number.isFinite(first) && Number.isFinite(second)) {
          // Google Maps uses {lat, lng}
          return { lat: first, lng: second };
        }
        return null;
      }

      if (point && typeof point === "object") {
        const lat = Number(point.lat ?? point.latitude);
        const lng = Number(point.lng ?? point.longitude);
        if (Number.isFinite(lat) && Number.isFinite(lng)) {
          return { lat, lng };
        }
      }

      return null;
    })
    .filter(Boolean);
}

export function buildRouteSegmentsFromItems(items = []) {
  if (!Array.isArray(items)) return [];

  return items
    .map((item, index) => {
      const routeFromPrevious = item?.routeFromPrevious;
      const polyline = normalizeRoutePolyline(
        routeFromPrevious?.polyline ?? routeFromPrevious?.encodedPolyline ?? routeFromPrevious?.path ?? routeFromPrevious,
      );

      if (polyline.length <= 1) {
        return null;
      }

      return {
        id: `route-${item?.id || item?.__placeEntityId || index}`,
        points: polyline,
      };
    })
    .filter(Boolean);
}

export function shouldFitViewportBounds(points = [], isAgencyFallback = false) {
  if (!Array.isArray(points) || points.length === 0) return false;
  return !isAgencyFallback;
}

export function shouldRequestClientRoute({
  pointCount = 0,
  routeSegmentCount = 0,
} = {}) {
  return pointCount > 1 && routeSegmentCount === 0;
}

export function shouldShowPlannedPathFallback() {
  return false;
}

/**
 * Custom Polyline component for react-google-maps
 */
function Polyline({ points, color = "#3b82f6", weight = 3, opacity = 0.5, dashArray, zIndex }) {
  const map = useMap();
  const maps = useMapsLibrary("maps");
  const polylineRef = useRef(null);

  useEffect(() => {
    if (!map || !maps || !points.length) return;

    if (polylineRef.current) {
      polylineRef.current.setMap(null);
    }

    const polyline = new maps.Polyline({
      path: points,
      geodesic: true,
      strokeColor: color,
      strokeOpacity: opacity,
      strokeWeight: weight,
      zIndex,
      icons: dashArray ? [{
        icon: { path: "M 0,-1 0,1", strokeOpacity: 1, scale: 2 },
        offset: "0",
        repeat: "10px"
      }] : []
    });

    polyline.setMap(map);
    polylineRef.current = polyline;

    return () => {
      polyline.setMap(null);
    };
  }, [map, maps, points, color, weight, opacity, dashArray, zIndex]);

  return null;
}

function FitBounds({ points, sidebarWidth, bottomPadding = 0 }) {
  const map = useMap();

  useEffect(() => {
    if (!map || !points.length) return;

    const bounds = new google.maps.LatLngBounds();
    points.forEach((point) => bounds.extend(point));

    map.fitBounds(bounds, {
      top: 60,
      right: 60,
      bottom: bottomPadding > 0 ? bottomPadding + 20 : 60,
      left: sidebarWidth > 0 ? sidebarWidth + 40 : 60,
    });
  }, [map, points, sidebarWidth, bottomPadding]);

  return null;
}

function FocusActiveStop({ points, activeIndex, sidebarWidth }) {
  const map = useMap();

  useEffect(() => {
    if (!map || !Number.isInteger(activeIndex) || activeIndex < 0 || activeIndex >= points.length) return;
    const activePoint = points[activeIndex];
    if (!activePoint) return;

    map.panTo(activePoint);
    if (sidebarWidth > 0) map.panBy(-(sidebarWidth / 2), 0);
    const currentZoom = map.getZoom();
    if (currentZoom < 14) {
      map.setZoom(14);
    }
  }, [activeIndex, map, points, sidebarWidth]);

  return null;
}

function FocusLiveMarker({ liveMarkers }) {
  const map = useMap();
  const latestMarker = liveMarkers[liveMarkers.length - 1] || null;

  useEffect(() => {
    if (!map || !latestMarker) return;
    map.panTo({ lat: latestMarker.lat, lng: latestMarker.lng });
    map.setZoom(15);
  }, [latestMarker, map]);

  return null;
}

function FocusSelectedPlace({ selectedPlace, sidebarWidth, bottomPadding = 0 }) {
  const map = useMap();

  useEffect(() => {
    if (!map || !selectedPlace) return;
    map.panTo({ lat: selectedPlace.lat, lng: selectedPlace.lng });
    if (sidebarWidth > 0) map.panBy(-(sidebarWidth / 2), 0);
    if (bottomPadding > 0) {
      map.panBy(0, Math.min(260, Math.round(bottomPadding * 0.5)));
    }
    const currentZoom = map.getZoom();
    if (!currentZoom || currentZoom < 15) {
      map.setZoom(15);
    }
  }, [bottomPadding, map, selectedPlace, sidebarWidth]);

  return null;
}

function pointToLatLngLiteral(point) {
  return { lat: point.lat, lng: point.lng };
}

function latLngToPoint(latLng) {
  if (!latLng) return null;

  const lat = typeof latLng.lat === "function" ? latLng.lat() : Number(latLng.lat);
  const lng = typeof latLng.lng === "function" ? latLng.lng() : Number(latLng.lng);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null;
  }

  return { lat, lng };
}

function ResolveClientRoute({ points, enabled, onRoute }) {
  const routes = useMapsLibrary("routes");

  useEffect(() => {
    if (!enabled || !Array.isArray(points) || points.length <= 1) {
      onRoute([], "idle");
      return;
    }

    const DirectionsService = routes?.DirectionsService ?? globalThis.google?.maps?.DirectionsService;
    const TravelMode = routes?.TravelMode ?? globalThis.google?.maps?.TravelMode;
    const DirectionsStatus = routes?.DirectionsStatus ?? globalThis.google?.maps?.DirectionsStatus;

    if (!DirectionsService || !TravelMode) {
      onRoute([], routes ? "unavailable" : "loading");
      return;
    }

    let cancelled = false;
    onRoute([], "loading");

    const origin = pointToLatLngLiteral(points[0]);
    const destination = pointToLatLngLiteral(points[points.length - 1]);
    const waypointPoints = points.slice(1, -1).slice(0, 23);
    const waypoints = waypointPoints.map((point) => ({
      location: pointToLatLngLiteral(point),
      stopover: true,
    }));

    const service = new DirectionsService();
    service.route(
      {
        origin,
        destination,
        waypoints,
        optimizeWaypoints: false,
        travelMode: TravelMode.DRIVING,
      },
      (result, status) => {
        if (cancelled) return;

        const okStatus = DirectionsStatus?.OK ?? "OK";
        const overviewPath = result?.routes?.[0]?.overview_path;
        if (status !== okStatus || !Array.isArray(overviewPath) || overviewPath.length <= 1) {
          onRoute([], "failed");
          return;
        }

        onRoute(overviewPath.map(latLngToPoint).filter(Boolean), "ready");
      },
    );

    return () => {
      cancelled = true;
    };
  }, [enabled, onRoute, points, routes]);

  return null;
}

function ResolveAgencyFallbackPoint({ fallback, enabled, onResolved }) {
  const map = useMap();
  const geocoding = useMapsLibrary("geocoding");

  useEffect(() => {
    if (!enabled || !fallback) {
      onResolved(null);
      return;
    }

    if (Number.isFinite(fallback.lat) && Number.isFinite(fallback.lng)) {
      const point = {
        id: fallback.id,
        name: fallback.label,
        title: fallback.label,
        description: "Agency registered location",
        formattedAddress: fallback.query,
        lat: fallback.lat,
        lng: fallback.lng,
        source: "agency",
      };
      onResolved(point);
      if (map) {
        map.panTo({ lat: point.lat, lng: point.lng });
        map.setZoom(11);
      }
      return;
    }

    if (!geocoding || !fallback.query) return;

    let cancelled = false;
    const geocoder = new geocoding.Geocoder();
    geocoder.geocode({ address: fallback.query }, (results, status) => {
      if (cancelled) return;
      if (status !== "OK" || !Array.isArray(results) || !results[0]?.geometry?.location) {
        onResolved(null);
        return;
      }

      const location = results[0].geometry.location;
      const point = {
        id: fallback.id,
        name: fallback.label,
        title: fallback.label,
        description: "Agency registered location",
        formattedAddress: results[0].formatted_address || fallback.query,
        lat: location.lat(),
        lng: location.lng(),
        source: "agency",
      };

      onResolved(point);
      if (map) {
        map.panTo({ lat: point.lat, lng: point.lng });
        map.setZoom(11);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [enabled, fallback, geocoding, map, onResolved]);

  return null;
}

function PlaceDetailPanel({ place, onClose }) {
  if (!place) return null;

  const mapsUrl = getGoogleMapsPlaceUrl(place);

  return (
    <aside
      className="absolute left-[18px] bottom-[18px] z-[520] grid gap-2 w-[min(360px,calc(100%-36px))] p-4 rounded-[18px] bg-[rgba(15,23,42,0.92)] text-white shadow-[0_18px_40px_rgba(15,23,42,0.28)] backdrop-blur-[12px]"
      aria-live="polite"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="text-[11px] font-bold tracking-[0.04em] uppercase text-white/60">
            {place.source === "live" ? "Live map result" : place.dayLabel || "Itinerary stop"}
          </span>
          <h3 className="mt-0.5 text-xl leading-tight text-white font-serif">{place.name}</h3>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close place detail"
          className="w-8 h-8 border-0 rounded-full bg-white/10 text-white cursor-pointer text-xl leading-none hover:bg-white/20 transition-colors"
        >
          ×
        </button>
      </div>
      {place.formattedAddress ? <p className="m-0 text-[13px] leading-[1.45] text-white/70">{place.formattedAddress}</p> : null}
      {place.timeLabel ? <small className="text-[11px] font-bold tracking-[0.04em] uppercase text-white/60">{place.timeLabel}</small> : null}
      {mapsUrl ? (
        <a
          href={mapsUrl}
          target="_blank"
          rel="noreferrer noopener"
          className="inline-flex justify-center mt-1 rounded-full bg-[#dbeafe] text-[#0f3f86] py-[9px] px-3 text-[13px] font-extrabold no-underline hover:opacity-90 transition-opacity"
        >
          Open in Google Maps
        </a>
      ) : null}
    </aside>
  );
}

function formatRouteDistance(meters) {
  const value = Number(meters);
  if (!Number.isFinite(value)) return "";
  if (value >= 1000) return `${(value / 1000).toFixed(value >= 10000 ? 0 : 1)} km`;
  return `${Math.round(value)} m`;
}

function formatRouteDuration(seconds) {
  const value = Number(seconds);
  if (!Number.isFinite(value)) return "";
  const minutes = Math.max(1, Math.round(value / 60));
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return remainder ? `${hours} hr ${remainder} min` : `${hours} hr`;
}

function RouteSummaryPanel({ route }) {
  if (!route?.origin || !route?.destination) return null;

  const directionsUrl = buildDirectionsUrl(route);
  const originLabel = getRoutePointLabel(route.origin, "Point A");
  const destinationLabel = getRoutePointLabel(route.destination, "Point B");
  const distance = formatRouteDistance(route.distanceMeters);
  const duration = formatRouteDuration(route.durationSeconds);

  return (
    <aside className="absolute right-[18px] bottom-[18px] z-[520] grid gap-2 w-[min(360px,calc(100%-36px))] p-4 rounded-[18px] bg-[rgba(15,23,42,0.92)] text-white shadow-[0_18px_40px_rgba(15,23,42,0.28)] backdrop-blur-[12px]">
      <span className="text-[11px] font-bold tracking-[0.04em] uppercase text-white/60">Latest route</span>
      <strong className="text-[15px] leading-snug">
        {originLabel} to {destinationLabel}
      </strong>
      {(distance || duration) && (
        <span className="text-[13px] text-white/70">
          {[distance, duration].filter(Boolean).join(" | ")}
        </span>
      )}
      {directionsUrl ? (
        <a
          href={directionsUrl}
          target="_blank"
          rel="noreferrer noopener"
          className="inline-flex justify-center mt-1 rounded-full bg-[#dbeafe] text-[#0f3f86] py-[9px] px-3 text-[13px] font-extrabold no-underline hover:opacity-90 transition-opacity"
        >
          Open route in Google Maps
        </a>
      ) : null}
    </aside>
  );
}

function MapHandler({ selectedPlaceId, viewportPoints, setSelectedPoint, sidebarWidth, bottomPadding = 0 }) {
  const map = useMap();

  useEffect(() => {
    if (!selectedPlaceId) {
      setSelectedPoint(null);
      return;
    }

    const point = viewportPoints.find((p) => p.id === selectedPlaceId);
    if (point) {
      setSelectedPoint(point);
      if (map) {
        map.panTo({ lat: point.lat, lng: point.lng });
        if (sidebarWidth > 0) map.panBy(-(sidebarWidth / 2), 0);
        if (bottomPadding > 0) {
          map.panBy(0, Math.min(260, Math.round(bottomPadding * 0.5)));
        }
        const currentZoom = map.getZoom();
        if (!currentZoom || currentZoom < 14) {
          map.setZoom(14);
        }
      }
    }
  }, [bottomPadding, selectedPlaceId, viewportPoints, map, setSelectedPoint, sidebarWidth]);

  return null;
}

// Triggering rebuild to clear stale map hook state
export default function ItineraryLiveMap({
  items = [],
  agencyLocation = null,
  liveMarkers = [],
  routeEstimates = [],
  activeIndex = -1,
  onHoverItem,
  selectedPlaceId = "",
  selectedPlace = null,
  onSelectPlace,
  theme = "light",
  sidebarWidth = 520,
  mapBottomPadding = 0,
}) {
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [agencyFallbackPoint, setAgencyFallbackPoint] = useState(null);
  const [clientRoutePolyline, setClientRoutePolyline] = useState([]);
  const [clientRouteStatus, setClientRouteStatus] = useState("idle");
  const isDark = theme === "dark";

  const points = useMemo(() => items.map((item, index) => mapItemToPoint(item, index)).filter(Boolean), [items]);
  const liveMarkerPoints = useMemo(
    () => (Array.isArray(liveMarkers) ? liveMarkers.map((marker, index) => normalizeLiveMarker(marker, index)).filter(Boolean) : []),
    [liveMarkers],
  );
  const latestRouteEstimate = useMemo(() => (
    Array.isArray(routeEstimates) && routeEstimates.length > 0 ? routeEstimates[routeEstimates.length - 1] : null
  ), [routeEstimates]);
  const latestRoutePolyline = useMemo(() => {
    return normalizeRoutePolyline(latestRouteEstimate?.polyline);
  }, [latestRouteEstimate]);
  const latestRouteEndpointPoints = useMemo(() => buildRouteEndpointPoints(latestRouteEstimate), [latestRouteEstimate]);
  const routeSegments = useMemo(() => buildRouteSegmentsFromItems(items), [items]);
  const agencyFallback = useMemo(() => normalizeAgencyFallbackLocation(agencyLocation), [agencyLocation]);
  const shouldResolveClientRoute = shouldRequestClientRoute({
    pointCount: points.length,
    routeSegmentCount: routeSegments.length,
  });

  const resolvedViewportPoints = useMemo(
    () => [...points, ...liveMarkerPoints, ...latestRouteEndpointPoints],
    [points, liveMarkerPoints, latestRouteEndpointPoints],
  );
  const shouldUseAgencyFallback = resolvedViewportPoints.length === 0 && Boolean(agencyFallbackPoint);
  const viewportPoints = useMemo(
    () => (shouldUseAgencyFallback ? [agencyFallbackPoint] : resolvedViewportPoints),
    [agencyFallbackPoint, resolvedViewportPoints, shouldUseAgencyFallback],
  );
  const center = viewportPoints[0] || EMPTY_MAP_CENTER;

  useEffect(() => {
    if (!selectedPlace) return;
    setSelectedPoint({
      id: selectedPlace.id,
      lat: selectedPlace.lat,
      lng: selectedPlace.lng,
      title: selectedPlace.name,
      name: selectedPlace.name,
      description: selectedPlace.description,
      formattedAddress: selectedPlace.formattedAddress,
    });
  }, [selectedPlace]);


  const handleMarkerClick = useCallback((point) => {
    setSelectedPoint(point);
    onSelectPlace?.(point.id);
  }, [onSelectPlace]);
  const handleClientRoute = useCallback((polyline, status) => {
    setClientRoutePolyline(polyline);
    setClientRouteStatus(status);
  }, []);

  return (
    <div className={`absolute inset-0 ${isDark ? "bg-[#111827]" : "bg-[#f8fafc]"}`}>
      <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
        <Map
          defaultCenter={center}
          defaultZoom={center.lat !== 0 ? 13 : 2}
          mapId={isDark ? "dark_map_id_placeholder" : MAP_ID}
          colorScheme={isDark ? "DARK" : "LIGHT"}
          style={{ width: "100%", height: "100%" }}
          disableDefaultUI={false}
          gestureHandling="greedy"
          mapTypeControlOptions={{ position: 3 }}
          fullscreenControlOptions={{ position: 3 }}
          streetViewControlOptions={{ position: 9 }}
          zoomControlOptions={{ position: 9 }}
        >
          <MapHandler
            selectedPlaceId={selectedPlaceId}
            viewportPoints={viewportPoints}
            setSelectedPoint={setSelectedPoint}
            sidebarWidth={sidebarWidth}
            bottomPadding={mapBottomPadding}
          />
          <ResolveAgencyFallbackPoint
            fallback={agencyFallback}
            enabled={resolvedViewportPoints.length === 0}
            onResolved={setAgencyFallbackPoint}
          />
          <ResolveClientRoute
            points={points}
            enabled={shouldResolveClientRoute}
            onRoute={handleClientRoute}
          />
          {shouldFitViewportBounds(viewportPoints, shouldUseAgencyFallback) && (
            <FitBounds points={viewportPoints} sidebarWidth={sidebarWidth} bottomPadding={mapBottomPadding} />
          )}
          <FocusActiveStop points={points} activeIndex={activeIndex} sidebarWidth={sidebarWidth} />
          <FocusLiveMarker liveMarkers={liveMarkerPoints} />
          <FocusSelectedPlace selectedPlace={selectedPlace} sidebarWidth={sidebarWidth} bottomPadding={mapBottomPadding} />

          {/* Planned path fallback */}
          {shouldShowPlannedPathFallback({
            pointCount: points.length,
            routeSegmentCount: routeSegments.length,
            clientRouteStatus,
          }) && (
            <Polyline
              points={points}
              color="#3b82f6"
              weight={3}
              opacity={0.4}
              dashArray={true}
            />
          )}

          {/* Client-side road route fallback */}
          {clientRoutePolyline.length > 1 && (
            <Polyline
              points={clientRoutePolyline}
              color="#d77a61"
              weight={5}
              opacity={0.82}
              zIndex={20}
            />
          )}

          {/* Stored per-stop route paths */}
          {routeSegments.map((segment) => (
            <Polyline
              key={segment.id}
              points={segment.points}
              color="#d77a61"
              weight={5}
              opacity={0.82}
              zIndex={20}
            />
          ))}

          {/* Latest route estimate overlay */}
          {latestRoutePolyline.length > 1 && (
            <Polyline
              points={latestRoutePolyline}
              color="#2563eb"
              weight={6}
              opacity={0.95}
              zIndex={40}
            />
          )}

          {/* Itinerary Markers */}
          {points.map((point, index) => {
            const isActive = activeIndex === index || selectedPlaceId === point.id;
            return (
              <AdvancedMarker
                key={`point-${index}-${point.lat}-${point.lng}`}
                position={{ lat: point.lat, lng: point.lng }}
                onMouseEnter={() => onHoverItem?.(index)}
                onClick={() => {
                  handleMarkerClick(point);
                  onHoverItem?.(index);
                }}
              >
                <Pin
                  background={isActive ? "#2563eb" : "#ffffff"}
                  borderColor={isActive ? "#1e3a8a" : "#1e293b"}
                  glyphColor={isActive ? "#ffffff" : "#1e293b"}
                  glyph={getMapPinGlyph(index)}
                  scale={isActive ? 1.2 : 1.0}
                />
              </AdvancedMarker>
            );
          })}

          {/* Live Resolution Markers */}
          {liveMarkerPoints.map((marker) => (
            <AdvancedMarker
              key={marker.id}
              position={{ lat: marker.lat, lng: marker.lng }}
              onClick={() => handleMarkerClick(marker)}
            >
              <Pin
                background={selectedPlaceId === marker.id ? "#2563eb" : "#d77a61"}
                borderColor="#b05b45"
                glyphColor="#ffffff"
                scale={selectedPlaceId === marker.id ? 1.22 : 1.1}
              />
            </AdvancedMarker>
          ))}

          {/* Latest route endpoints */}
          {latestRouteEndpointPoints.map((point) => (
            <AdvancedMarker
              key={point.id}
              position={{ lat: point.lat, lng: point.lng }}
              onClick={() => handleMarkerClick(point)}
            >
              <Pin
                background="#2563eb"
                borderColor="#1e3a8a"
                glyphColor="#ffffff"
                glyph={point.glyph}
                scale={1.15}
              />
            </AdvancedMarker>
          ))}

          {/* Agency fallback marker */}
          {shouldUseAgencyFallback && (
            <AdvancedMarker
              key={agencyFallbackPoint.id}
              position={{ lat: agencyFallbackPoint.lat, lng: agencyFallbackPoint.lng }}
              onClick={() => handleMarkerClick(agencyFallbackPoint)}
            >
              <Pin
                background="#0f3440"
                borderColor="#ffffff"
                glyphColor="#ffffff"
                scale={1.1}
              />
            </AdvancedMarker>
          )}

          {/* Info Window */}
          {selectedPoint && (
            <InfoWindow
              position={{ lat: selectedPoint.lat, lng: selectedPoint.lng }}
              onCloseClick={() => setSelectedPoint(null)}
            >
              <div style={{ padding: "4px", color: "#1e293b", minWidth: "170px" }}>
                <strong style={{ fontSize: "14px", display: "block", marginBottom: "2px" }}>
                  {selectedPoint.title || selectedPoint.name}
                </strong>
                {(selectedPoint.placeType || selectedPoint.rating) && (
                  <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "4px" }}>
                    {selectedPoint.rating ? `★ ${selectedPoint.rating}` : ""}
                    {selectedPoint.rating && selectedPoint.placeType ? " · " : ""}
                    {selectedPoint.placeType || ""}
                  </div>
                )}
                {selectedPoint.timeLabel ? (
                  <div style={{ fontSize: "12px", color: "#ea7a5e", fontWeight: 600, marginBottom: "4px" }}>
                    {selectedPoint.timeLabel}
                  </div>
                ) : null}
                {(selectedPoint.description || selectedPoint.formattedAddress) && (
                  <div style={{ fontSize: "12px", color: "#64748b", lineHeight: 1.4 }}>
                    {selectedPoint.description || selectedPoint.formattedAddress}
                  </div>
                )}
              </div>
            </InfoWindow>
          )}
        </Map>
      </APIProvider>

      {!viewportPoints.length ? (
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 grid gap-1.5 w-[min(320px,calc(100%-48px))] text-center p-6 border border-[rgba(226,232,240,0.8)] rounded-[20px] bg-white/95 backdrop-blur-[8px] text-[#0f172a] z-[500] shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1),_0_8px_10px_-6px_rgba(0,0,0,0.1)] pointer-events-none">
          <strong className="text-base font-semibold">
            {GOOGLE_MAPS_API_KEY ? "Map coordinates pending" : "Map unavailable"}
          </strong>
          <span className="text-[#64748b] text-[13px] leading-[1.5]">
            {GOOGLE_MAPS_API_KEY
              ? "Locations will appear after the backend resolves itinerary places."
              : "Set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in your .env to enable the map."}
          </span>
        </div>
      ) : null}

      <PlaceDetailPanel place={selectedPlace} onClose={() => onSelectPlace?.("")} />
      <RouteSummaryPanel route={latestRouteEstimate} />
    </div>
  );
}
