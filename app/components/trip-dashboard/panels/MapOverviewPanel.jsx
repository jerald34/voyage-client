"use client";

import { useEffect, useMemo, useRef, useState } from "react";

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
const GOOGLE_MAPS_MAP_ID = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID;

function getMappedPoint(highlight) {
  const lat = Number(highlight?.lat ?? highlight?.latitude ?? highlight?.placeSnapshot?.latitude);
  const lng = Number(highlight?.lng ?? highlight?.longitude ?? highlight?.placeSnapshot?.longitude);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null;
  }

  return {
    lat,
    lng,
    title: highlight?.value || highlight?.label || "Resolved location",
  };
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
    if (!hasApiKey || !mapNodeRef.current || routePoints.length === 0) {
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

        const center = routePoints[0];
        const map = new Map(mapNodeRef.current, {
          center,
          zoom: 13,
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: false,
          ...(GOOGLE_MAPS_MAP_ID ? { mapId: GOOGLE_MAPS_MAP_ID } : {}),
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
    <section className="sticky top-[110px] grid gap-5 p-5">
      <div>
        <span className="inline-flex items-center gap-2.5 text-secondary text-xs font-extrabold tracking-[0.18em] uppercase">
          <span className="w-11 h-px bg-current opacity-55" />
          Route overview
        </span>
        <h2>Route overview</h2>
        <p className="text-[1.08rem] text-text-muted mb-6">A fast visual pass across the neighborhoods shaping {destination}.</p>
      </div>

      {hasApiKey && routePoints.length > 0 ? (
        <div className="relative w-full aspect-[4/3] rounded-lg overflow-hidden border border-border shadow-soft">
          <div
            ref={mapNodeRef}
            className="absolute inset-0 w-full h-full"
            aria-label="Google map route overview"
          />

          {mapStatus === "loading" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-surface/[0.88] backdrop-blur-sm gap-3 z-[1]">
              <strong className="text-text-primary text-sm font-bold">Loading map...</strong>
            </div>
          )}

          {mapStatus === "error" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-surface/[0.88] backdrop-blur-sm gap-3 z-[1] px-5 text-center">
              <strong className="text-text-primary text-sm font-bold">Map unavailable</strong>
              <span className="text-text-soft text-xs">{mapError || "Please verify your Google Maps API key restrictions."}</span>
            </div>
          )}
        </div>
      ) : (
        <div className="relative w-full aspect-[4/3] rounded-lg overflow-hidden border border-border shadow-soft bg-background">
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-text-soft text-center px-5">
            <span className="text-xs text-text-muted">Route coordinates pending</span>
            <strong className="text-sm font-bold text-text-primary">Map preview appears after resolved locations are available.</strong>
          </div>
        </div>
      )}
    </section>
  );
}
