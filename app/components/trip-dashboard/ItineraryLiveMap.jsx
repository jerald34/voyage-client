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

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";
const MAP_ID = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID || "a1950eb4eae71842fa9590f9";

const EMPTY_MAP_CENTER = { lat: 0, lng: 0 };

function mapItemToPoint(item, index) {
  const rawLat = Number(item?.lat ?? item?.latitude ?? item?.placeSnapshot?.latitude);
  const rawLng = Number(item?.lng ?? item?.longitude ?? item?.placeSnapshot?.longitude);
  if (Number.isFinite(rawLat) && Number.isFinite(rawLng)) {
    return {
      lat: rawLat,
      lng: rawLng,
      title: item?.title || `Itinerary item ${index + 1}`,
      description: item?.description || item?.type || "",
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
    id: String(marker?.id || marker?.placeSnapshotId || `live-marker-${index}`),
    name: marker?.name || marker?.formattedAddress || marker?.address || `Resolved location ${index + 1}`,
    formattedAddress: marker?.formattedAddress || marker?.address || "",
    lat: rawLat,
    lng: rawLng,
  };
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

function normalizeRoutePolyline(polyline) {
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

/**
 * Custom Polyline component for react-google-maps
 */
function Polyline({ points, color = "#3b82f6", weight = 3, opacity = 0.5, dashArray }) {
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
  }, [map, maps, points, color, weight, opacity, dashArray]);

  return null;
}

function FitBounds({ points }) {
  const map = useMap();

  useEffect(() => {
    if (!map || !points.length) return;

    const bounds = new google.maps.LatLngBounds();
    points.forEach((point) => bounds.extend(point));
    
    map.fitBounds(bounds, {
      top: 36,
      right: 36,
      bottom: 36,
      left: 36,
    });
  }, [map, points]);

  return null;
}

function FocusActiveStop({ points, activeIndex }) {
  const map = useMap();

  useEffect(() => {
    if (!map || !Number.isInteger(activeIndex) || activeIndex < 0 || activeIndex >= points.length) return;
    const activePoint = points[activeIndex];
    if (!activePoint) return;
    
    map.panTo(activePoint);
    const currentZoom = map.getZoom();
    if (currentZoom < 14) {
      map.setZoom(14);
    }
  }, [activeIndex, map, points]);

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

export default function ItineraryLiveMap({ items = [], liveMarkers = [], routeEstimates = [], activeIndex = -1, onHoverItem }) {
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [hoveredPoint, setHoveredPoint] = useState(null);

  const points = useMemo(() => items.map((item, index) => mapItemToPoint(item, index)).filter(Boolean), [items]);
  const liveMarkerPoints = useMemo(
    () => (Array.isArray(liveMarkers) ? liveMarkers.map((marker, index) => normalizeLiveMarker(marker, index)).filter(Boolean) : []),
    [liveMarkers],
  );
  const latestRoutePolyline = useMemo(() => {
    if (!Array.isArray(routeEstimates) || routeEstimates.length === 0) {
      return [];
    }

    const latestRoute = routeEstimates[routeEstimates.length - 1];
    return normalizeRoutePolyline(latestRoute?.polyline);
  }, [routeEstimates]);

  const viewportPoints = useMemo(() => [...points, ...liveMarkerPoints], [points, liveMarkerPoints]);
  const center = viewportPoints[0] || EMPTY_MAP_CENTER;

  const handleMarkerClick = useCallback((point) => {
    setSelectedPoint(point);
  }, []);

  return (
    <div className="itinerary-live-map-shell">
      <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
        <Map
          defaultCenter={center}
          defaultZoom={center.lat !== 0 ? 13 : 2}
          mapId={MAP_ID}
          className="itinerary-live-map"
          disableDefaultUI={false}
          gestureHandling="greedy"
        >
          {viewportPoints.length > 0 && <FitBounds points={viewportPoints} />}
          <FocusActiveStop points={points} activeIndex={activeIndex} />
          <FocusLiveMarker liveMarkers={liveMarkerPoints} />

          {/* Planned path */}
          {points.length > 1 && (
            <Polyline
              points={points}
              color="#3b82f6"
              weight={3}
              opacity={0.4}
              dashArray={true}
            />
          )}

          {/* Actual route estimates */}
          {latestRoutePolyline.length > 1 && (
            <Polyline
              points={latestRoutePolyline}
              color="#d77a61"
              weight={5}
              opacity={0.9}
            />
          )}

          {/* Itinerary Markers */}
          {points.map((point, index) => {
            const isActive = activeIndex === index;
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
                  scale={isActive ? 1.2 : 1.0}
                >
                  <span style={{ fontSize: "10px", fontWeight: "bold" }}>{index + 1}</span>
                </Pin>
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
                background="#d77a61"
                borderColor="#b05b45"
                glyphColor="#ffffff"
                scale={1.1}
              />
            </AdvancedMarker>
          ))}

          {/* Info Window */}
          {selectedPoint && (
            <InfoWindow
              position={{ lat: selectedPoint.lat, lng: selectedPoint.lng }}
              onCloseClick={() => setSelectedPoint(null)}
            >
              <div style={{ padding: "4px", color: "#1e293b" }}>
                <strong style={{ fontSize: "14px", display: "block", marginBottom: "4px" }}>
                  {selectedPoint.title || selectedPoint.name}
                </strong>
                {(selectedPoint.description || selectedPoint.formattedAddress) && (
                  <div style={{ fontSize: "12px", color: "#64748b" }}>
                    {selectedPoint.description || selectedPoint.formattedAddress}
                  </div>
                )}
              </div>
            </InfoWindow>
          )}
        </Map>
      </APIProvider>

      {!viewportPoints.length ? (
        <div className="empty-map-content">
          <strong>Map coordinates pending</strong>
          <span>Locations will appear after the backend resolves itinerary places.</span>
        </div>
      ) : null}

      <style jsx>{`
        .itinerary-live-map-shell {
          position: absolute;
          inset: 0;
          background: #f8fafc;
        }

        .itinerary-live-map {
          width: 100%;
          height: 100%;
        }

        .empty-map-content {
          position: absolute;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
          display: grid;
          gap: 6px;
          width: min(320px, calc(100% - 48px));
          text-align: center;
          padding: 24px;
          border: 1px solid rgba(226, 232, 240, 0.8);
          border-radius: 20px;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(8px);
          color: #0f172a;
          z-index: 500;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
          pointer-events: none;
        }

        .empty-map-content strong {
          font-size: 16px;
          font-weight: 600;
        }

        .empty-map-content span {
          color: #64748b;
          font-size: 13px;
          line-height: 1.5;
        }
      `}</style>
    </div>
  );
}
