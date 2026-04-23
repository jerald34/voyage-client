"use client";

import { useEffect, useMemo, useRef, useState } from "react";

const DEFAULT_CENTER = { lat: 14.8386, lng: 120.2842 };
const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
const GOOGLE_MAPS_MAP_ID = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID || "DEMO_MAP_ID";

const locationCoordinateRules = [
  {
    terms: ["subic bay boardwalk", "boardwalk", "sunset walk", "morning loop"],
    point: { lat: 14.8246, lng: 120.2813 },
    label: "Subic Bay Boardwalk",
  },
  {
    terms: ["olongapo city hall"],
    point: { lat: 14.842131, lng: 120.287702 },
    label: "Olongapo City Hall",
  },
  {
    terms: ["rizal triangle"],
    point: { lat: 14.8426, lng: 120.2884 },
    label: "Rizal Triangle",
  },
  {
    terms: ["harbor point", "hotel check-in", "city center"],
    point: { lat: 14.8298, lng: 120.2817 },
    label: "Harbor Point / City Center",
  },
  {
    terms: ["kalaklan", "local lunch and market stop"],
    point: { lat: 14.8189, lng: 120.2759 },
    label: "Kalaklan",
  },
  {
    terms: ["airport transfer", "subic bay international airport"],
    point: { lat: 14.7944, lng: 120.2719 },
    label: "Subic Bay International Airport",
  },
  {
    terms: ["sunset viewpoint", "hillside", "subic bay"],
    point: { lat: 14.832506, lng: 120.269397 },
    label: "Subic Bay Viewpoint",
  },
];

function normalize(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function getMappedPoint(highlight) {
  const searchText = `${normalize(highlight?.value)} ${normalize(highlight?.label)}`;
  const matched = locationCoordinateRules.find((rule) =>
    rule.terms.some((term) => searchText.includes(normalize(term))),
  );

  return matched
    ? {
        ...matched.point,
        title: highlight?.value || matched.label,
      }
    : null;
}

function getRoutePoints(highlights) {
  const safeHighlights = Array.isArray(highlights) ? highlights : [];
  const points = safeHighlights.map(getMappedPoint).filter(Boolean);
  const unique = new Map();

  points.forEach((point) => {
    unique.set(`${point.lat.toFixed(5)}|${point.lng.toFixed(5)}`, point);
  });

  return [...unique.values()];
}

function loadGoogleMapsApi(apiKey) {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Google Maps can only be loaded in a browser."));
  }

  if (window.google?.maps) {
    return Promise.resolve(window.google.maps);
  }

  if (window.__voyageGoogleMapsPromise) {
    return window.__voyageGoogleMapsPromise;
  }

  window.__voyageGoogleMapsPromise = new Promise((resolve, reject) => {
    const scriptId = "voyage-google-maps-script";
    const existing = document.getElementById(scriptId);

    if (existing) {
      const currentSrc = existing.getAttribute("src") || "";
      if (!currentSrc.includes("loading=async")) {
        existing.remove();
      } else {
        existing.addEventListener("load", () => resolve(window.google?.maps));
        existing.addEventListener("error", () => reject(new Error("Unable to load Google Maps script.")));
        return;
      }
    }

    const script = document.createElement("script");
    script.id = scriptId;
    script.async = true;
    script.defer = true;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&v=weekly&loading=async`;

    script.onload = () => {
      if (window.google?.maps) {
        resolve(window.google.maps);
        return;
      }

      reject(new Error("Google Maps loaded without a maps namespace."));
    };

    script.onerror = () => reject(new Error("Unable to load Google Maps script."));
    document.head.appendChild(script);
  });

  return window.__voyageGoogleMapsPromise;
}

export default function MapOverviewPanel({ tripBrief, mapHighlights }) {
  const highlights = Array.isArray(mapHighlights) ? mapHighlights.slice(0, 3) : [];
  const destination = tripBrief?.destination || "this trip";
  const mapNodeRef = useRef(null);
  const markersRef = useRef([]);
  const polylineRef = useRef(null);
  const [mapStatus, setMapStatus] = useState("idle");
  const [mapError, setMapError] = useState("");
  const routePoints = useMemo(() => getRoutePoints(highlights), [highlights]);
  const hasApiKey = Boolean(GOOGLE_MAPS_API_KEY);

  useEffect(() => {
    if (!hasApiKey || !mapNodeRef.current) {
      return;
    }

    let isActive = true;

    async function initMap() {
      try {
        setMapStatus("loading");
        setMapError("");

        await loadGoogleMapsApi(GOOGLE_MAPS_API_KEY);
        const { Map, InfoWindow } = await window.google.maps.importLibrary("maps");
        const { AdvancedMarkerElement, PinElement } = await window.google.maps.importLibrary("marker");

        if (!isActive || !mapNodeRef.current) {
          return;
        }

        const center = routePoints[0] || DEFAULT_CENTER;
        const map = new Map(mapNodeRef.current, {
          center,
          zoom: 13,
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: false,
          mapId: GOOGLE_MAPS_MAP_ID,
        });

        const infoWindow = new InfoWindow();
        markersRef.current.forEach((marker) => {
          marker.map = null;
        });
        markersRef.current = [];

        routePoints.forEach((point, index) => {
          const pin = new PinElement({
            background: "#223843",
            borderColor: "#ffffff",
            glyphColor: "#ffffff",
            glyphText: `${index + 1}`,
            scale: 1,
          });

          const marker = new AdvancedMarkerElement({
            map,
            position: { lat: point.lat, lng: point.lng },
            title: point.title,
            content: pin,
          });

          marker.addEventListener("gmp-click", () => {
            infoWindow.setContent(`<strong>${point.title}</strong>`);
            infoWindow.open({ anchor: marker, map });
          });

          markersRef.current.push(marker);
        });

        if (polylineRef.current) {
          polylineRef.current.setMap(null);
        }

        if (routePoints.length > 1) {
          polylineRef.current = new window.google.maps.Polyline({
            path: routePoints.map((point) => ({ lat: point.lat, lng: point.lng })),
            geodesic: true,
            strokeColor: "#D77A61",
            strokeOpacity: 0.9,
            strokeWeight: 3,
          });
          polylineRef.current.setMap(map);

          const bounds = new window.google.maps.LatLngBounds();
          routePoints.forEach((point) => bounds.extend(point));
          map.fitBounds(bounds, 52);
        }

        setMapStatus("ready");
      } catch (error) {
        if (!isActive) {
          return;
        }

        setMapStatus("error");
        setMapError(error instanceof Error ? error.message : "Unable to initialize Google Maps.");
      }
    }

    initMap();

    return () => {
      isActive = false;
      markersRef.current.forEach((marker) => {
        marker.map = null;
      });
      markersRef.current = [];
      if (polylineRef.current) {
        polylineRef.current.setMap(null);
        polylineRef.current = null;
      }
    };
  }, [hasApiKey, routePoints]);

  return (
    <section className="trip-map-panel frame-panel">
      <div>
        <span className="frame-label">Route overview</span>
        <h2>Route overview</h2>
        <p className="lede">A fast visual pass across the neighborhoods shaping {destination}.</p>
      </div>

      {hasApiKey ? (
        <div className="trip-map-canvas has-live-map">
          <div ref={mapNodeRef} className="trip-map-live" aria-label="Google map route overview" />

          {mapStatus === "loading" && (
            <div className="trip-map-overlay">
              <strong>Loading map...</strong>
            </div>
          )}

          {mapStatus === "error" && (
            <div className="trip-map-overlay">
              <strong>Map unavailable</strong>
              <span>{mapError || "Please verify your Google Maps API key restrictions."}</span>
            </div>
          )}
        </div>
      ) : (
        <div className="trip-map-canvas">
          <div className="trip-map-route" aria-hidden="true" />
          {highlights.length > 0 ? (
            highlights.map((highlight, index) => (
              <div key={`${highlight.label}-${highlight.value}`} className={`trip-map-pin trip-map-pin-${index + 1}`}>
                <span>{highlight.label}</span>
                <strong>{highlight.value}</strong>
              </div>
            ))
          ) : (
            <div className="trip-map-pin trip-map-pin-1">
              <span>Planning view</span>
              <strong>Add itinerary locations to preview the route</strong>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
