"use client";

import { useEffect, useMemo } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, Polyline, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";

const DEFAULT_CENTER = { lat: 14.8386, lng: 120.2842 };

const locationCoordinateRules = [
  { terms: ["airport", "arrival", "terminal"], point: { lat: 14.7944, lng: 120.2719 } },
  { terms: ["hotel", "check-in", "downtown"], point: { lat: 14.8298, lng: 120.2817 } },
  { terms: ["city hall"], point: { lat: 14.842131, lng: 120.287702 } },
  { terms: ["rizal"], point: { lat: 14.8426, lng: 120.2884 } },
  { terms: ["boardwalk", "bay", "sunset"], point: { lat: 14.8246, lng: 120.2813 } },
  { terms: ["market", "kalaklan", "lunch"], point: { lat: 14.8189, lng: 120.2759 } },
];

function normalize(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function mapItemToPoint(item, index) {
  const rawLat = Number(item?.lat ?? item?.latitude);
  const rawLng = Number(item?.lng ?? item?.longitude);
  if (Number.isFinite(rawLat) && Number.isFinite(rawLng)) {
    return {
      lat: rawLat,
      lng: rawLng,
      title: item?.title || `Stop ${index + 1}`,
      description: item?.description || item?.type || "",
    };
  }

  const searchText = `${normalize(item?.title)} ${normalize(item?.description)} ${normalize(item?.type)}`;
  const matched = locationCoordinateRules.find((rule) => rule.terms.some((term) => searchText.includes(term)));
  if (matched) {
    return {
      ...matched.point,
      title: item?.title || `Stop ${index + 1}`,
      description: item?.description || item?.type || "",
    };
  }

  const spread = 0.0075;
  return {
    lat: DEFAULT_CENTER.lat + spread * Math.sin(index * 1.4),
    lng: DEFAULT_CENTER.lng + spread * Math.cos(index * 1.2),
    title: item?.title || `Stop ${index + 1}`,
    description: item?.description || item?.type || "",
  };
}

function FitBounds({ points }) {
  const map = useMap();

  useEffect(() => {
    let isCancelled = false;

    const applyViewport = () => {
      if (isCancelled) return;
      if (!map || !map.getContainer?.()) return;

      if (!points.length) {
        map.setView([DEFAULT_CENTER.lat, DEFAULT_CENTER.lng], 13, { animate: false });
        return;
      }

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

export default function ItineraryLiveMap({ items = [], activeIndex = -1, onHoverItem }) {
  const points = useMemo(() => items.map((item, index) => mapItemToPoint(item, index)), [items]);
  const center = points[0] || DEFAULT_CENTER;

  return (
    <MapContainer center={center} zoom={13} className="itinerary-live-map" scrollWheelZoom={true}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
      />
      <FitBounds points={points} />
      <FocusActiveStop points={points} activeIndex={activeIndex} />

      {points.length > 1 && (
        <Polyline
          positions={points.map((point) => [point.lat, point.lng])}
          pathOptions={{ color: "#3b82f6", weight: 3, opacity: 0.4, dashArray: "5, 10" }}
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
    </MapContainer>
  );
}
