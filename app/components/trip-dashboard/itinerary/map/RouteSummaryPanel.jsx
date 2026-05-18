"use client";

import { buildDirectionsUrl } from "../ItineraryLiveMap.jsx";

function getRoutePointLabel(point, fallback) {
  return String(point?.name || point?.title || point?.formattedAddress || point?.address || fallback).trim();
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

export default function RouteSummaryPanel({ route }) {
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
