"use client";

import { useEffect, useMemo } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, Polyline, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";

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

    coordinates.push([lat / 1e5, lng / 1e5]);
  }

  return coordinates;
}

function normalizeRoutePolyline(polyline) {
  if (!polyline) {
    return [];
  }

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

  if (!Array.isArray(polyline)) {
    return [];
  }

  return polyline
    .map((point) => {
      if (Array.isArray(point) && point.length >= 2) {
        const first = Number(point[0]);
        const second = Number(point[1]);
        if (Number.isFinite(first) && Number.isFinite(second)) {
          if (Math.abs(first) > 90 && Math.abs(second) <= 90) {
            return [second, first];
          }

          return [first, second];
        }
        return null;
      }

      if (point && typeof point === "object") {
        const lat = Number(point.lat ?? point.latitude);
        const lng = Number(point.lng ?? point.longitude);
        if (Number.isFinite(lat) && Number.isFinite(lng)) {
          return [lat, lng];
        }
      }

      return null;
    })
    .filter(Boolean);
}

function FitBounds({ points }) {
  const map = useMap();

  useEffect(() => {
    let isCancelled = false;

    const applyViewport = () => {
      if (isCancelled) return;
      if (!map || !map.getContainer?.()) return;

      if (points.length === 1) {
        map.setView([points[0].lat, points[0].lng], 13, { animate: false });
        return;
      }

      map.fitBounds(
        points.map((point) => [point.lat, point.lng]),
        {
          padding: [36, 36],
          maxZoom: 14,
          animate: false,
        }
      );
    };

    if (map.whenReady) {
      map.whenReady(() => {
        // Wait one frame so panes/layers are fully available in dev strict re-renders.
        requestAnimationFrame(applyViewport);
      });
    } else {
      requestAnimationFrame(applyViewport);
    }

    return () => {
      isCancelled = true;
    };
  }, [map, points]);

  return null;
}

function FocusActiveStop({ points, activeIndex }) {
  const map = useMap();

  useEffect(() => {
    if (!map || !map.getContainer?.()) return;
    if (!Number.isInteger(activeIndex) || activeIndex < 0 || activeIndex >= points.length) return;
    const activePoint = points[activeIndex];
    if (!activePoint) return;
    const zoom = map.getZoom() >= 13 ? map.getZoom() : 13;
    map.flyTo([activePoint.lat, activePoint.lng], zoom, { duration: 0.35 });
  }, [activeIndex, map, points]);

  return null;
}

function FocusLiveMarker({ liveMarkers }) {
  const map = useMap();
  const latestMarker = liveMarkers[liveMarkers.length - 1] || null;

  useEffect(() => {
    if (!map || !map.getContainer?.() || !latestMarker) return;
    map.flyTo([latestMarker.lat, latestMarker.lng], 14, { animate: true, duration: 1.5 });
  }, [latestMarker, map]);

  return null;
}

export default function ItineraryLiveMap({ items = [], liveMarkers = [], routeEstimates = [], activeIndex = -1, onHoverItem }) {
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
  const center = viewportPoints[0];

  return (
    <div className="itinerary-live-map-shell">
      <MapContainer center={center || EMPTY_MAP_CENTER} zoom={center ? 13 : 2} className="itinerary-live-map" scrollWheelZoom={true}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />
        {center ? <FitBounds points={viewportPoints} /> : null}
        <FocusActiveStop points={points} activeIndex={activeIndex} />
        <FocusLiveMarker liveMarkers={liveMarkerPoints} />

        {points.length > 1 && (
          <Polyline
            positions={points.map((point) => [point.lat, point.lng])}
            pathOptions={{ color: "#3b82f6", weight: 3, opacity: 0.4, dashArray: "5, 10" }}
          />
        )}

        {latestRoutePolyline.length > 1 && (
          <Polyline
            positions={latestRoutePolyline}
            pathOptions={{ color: "#d77a61", weight: 4, opacity: 0.75 }}
          />
        )}

        {points.map((point, index) => {
          const isActive = activeIndex === index;
          return (
            <CircleMarker
              key={`${point.lat}-${point.lng}-${index}`}
              center={[point.lat, point.lng]}
              radius={isActive ? 12 : 8}
              pathOptions={{
                color: isActive ? "#2563eb" : "#1e293b",
                fillColor: isActive ? "#3b82f6" : "#ffffff",
                fillOpacity: 1,
                weight: isActive ? 4 : 2,
              }}
              eventHandlers={{
                mouseover: () => onHoverItem?.(index),
                click: () => onHoverItem?.(index),
              }}
            >
              <Popup>
                <div style={{ padding: "4px" }}>
                  <strong style={{ fontSize: "14px", display: "block", marginBottom: "4px" }}>{point.title}</strong>
                  {point.description ? <div style={{ fontSize: "12px", color: "#64748b" }}>{point.description}</div> : null}
                </div>
              </Popup>
            </CircleMarker>
          );
        })}

        {liveMarkerPoints.map((marker) => (
          <CircleMarker
            key={marker.id}
            center={[marker.lat, marker.lng]}
            radius={10}
            pathOptions={{
              color: "#d77a61",
              fillColor: "#fef3ef",
              fillOpacity: 1,
              weight: 3,
            }}
          >
            <Popup>
              <div style={{ padding: "4px" }}>
                <strong style={{ fontSize: "14px", display: "block", marginBottom: "4px" }}>{marker.name}</strong>
                {marker.formattedAddress ? <div style={{ fontSize: "12px", color: "#64748b" }}>{marker.formattedAddress}</div> : null}
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
      {!center ? (
        <div className="empty-map-content">
          <strong>Map coordinates pending</strong>
          <span>Locations will appear after the backend resolves itinerary places.</span>
        </div>
      ) : null}
      <style jsx>{`
        .itinerary-live-map-shell {
          position: absolute;
          inset: 0;
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
          padding: 18px;
          border: 1px solid var(--voyage-border);
          border-radius: 14px;
          background: rgba(255, 255, 255, 0.9);
          color: var(--voyage-primary);
          z-index: 500;
          box-shadow: var(--voyage-shadow-soft);
          pointer-events: none;
        }

        .empty-map-content strong {
          font-size: 14px;
        }

        .empty-map-content span {
          color: var(--voyage-text-muted);
          font-size: 12px;
          line-height: 1.5;
        }
      `}</style>
    </div>
  );
}
