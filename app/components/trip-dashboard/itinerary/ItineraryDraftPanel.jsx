import React, { useEffect, useMemo, useRef, useState } from "react";
import "./ItineraryDraftPanel.css";
import dynamic from "next/dynamic";
import { getItineraryPlaceEntityId } from "../../../lib/trip-dashboard/placeEntities.js";

const ItineraryLiveMap = dynamic(() => import("./ItineraryLiveMap.jsx"), { ssr: false });

function getItemTimeLabel(item) {
  if (typeof item?.time === "string" && item.time.trim()) return item.time;
  if (item?.startTime && item?.endTime) return `${item.startTime} - ${item.endTime}`;
  if (item?.startTime) return item.startTime;
  if (item?.endTime) return `Ends ${item.endTime}`;
  return "Time pending";
}

const formatDistance = (m) => (!m || m <= 0) ? null : (m >= 1000 ? `${(m / 1000).toFixed(m >= 10000 ? 0 : 1)} km` : `${Math.round(m)} m`);
const formatDuration = (s) => {
  if (!s || s <= 0) return null;
  const mins = Math.round(s / 60);
  if (mins < 60) return `${mins} min`;
  const hrs = Math.floor(mins / 60);
  const rem = mins % 60;
  return rem > 0 ? `${hrs}h ${rem}m` : `${hrs}h`;
};

export default function ItineraryDraftPanel({
  itinerary = null,
  draftDays,
  draftVersion,
  onContinue = () => { },
  dispatchAgentMessage,
  mapMarkers = [],
  routeEstimates = [],
  placeEntities = [],
  selectedPlaceId = "",
  onPlaceSelect,
}) {
  const safeDays = useMemo(() => Array.isArray(itinerary?.days) ? itinerary.days : (Array.isArray(draftDays) ? draftDays : []), [itinerary, draftDays]);
  const panelTitle = itinerary?.title || "Live Itinerary";
  const panelSummary = itinerary?.summary || "";
  const latestEstimate = routeEstimates?.[routeEstimates.length - 1];

  const mapItems = useMemo(() => safeDays.reduce((acc, day) => {
    (day?.items || []).forEach((item, idx) => acc.push({
      ...item,
      __dayNumber: day?.dayNumber,
      __dayTitle: day?.title,
      __itemIndex: idx,
      __placeEntityId: getItineraryPlaceEntityId(item, day, idx),
    }));
    return acc;
  }, []), [safeDays]);
  const selectedPlace = useMemo(
    () => placeEntities.find((place) => place.id === selectedPlaceId) ?? null,
    [placeEntities, selectedPlaceId],
  );

  const [activeStopIndex, setActiveStopIndex] = useState(mapItems.length > 0 ? 0 : -1);
  const [isMinimized, setIsMinimized] = useState(false);
  const [position, setPosition] = useState({ x: 8, y: 56 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const containerRef = useRef(null);

  useEffect(() => { setActiveStopIndex(mapItems.length > 0 ? 0 : -1); }, [mapItems.length]);

  useEffect(() => {
    if (!selectedPlaceId) return;
    const nextIndex = mapItems.findIndex((item) => item.__placeEntityId === selectedPlaceId);
    if (nextIndex >= 0) {
      setActiveStopIndex(nextIndex);
    }
  }, [mapItems, selectedPlaceId]);

  useEffect(() => {
    const handleMove = (e) => {
      if (!isDragging) return;
      let newX = e.clientX - dragStartPos.current.x;
      let newY = e.clientY - dragStartPos.current.y;
      if (containerRef.current) {
        const b = containerRef.current.getBoundingClientRect();
        newX = Math.max(0, Math.min(newX, b.width - 440));
        newY = Math.max(0, Math.min(newY, b.height - 80));
      }
      setPosition({ x: newX, y: newY });
    };
    const handleUp = () => setIsDragging(false);
    if (isDragging) { window.addEventListener("mousemove", handleMove); window.addEventListener("mouseup", handleUp); }
    return () => { window.removeEventListener("mousemove", handleMove); window.removeEventListener("mouseup", handleUp); };
  }, [isDragging]);

  return (
    <div className="itinerary-draft-panel" ref={containerRef}>
      <div className="map-background">
        <ItineraryLiveMap
          items={mapItems}
          liveMarkers={mapMarkers}
          routeEstimates={routeEstimates}
          activeIndex={activeStopIndex}
          onHoverItem={setActiveStopIndex}
          selectedPlaceId={selectedPlaceId}
          selectedPlace={selectedPlace}
          onSelectPlace={onPlaceSelect}
        />
      </div>

      {/* <header className="panel-header">
        <div className="header-actions">
          <span className="draft-version-tag"><span className="dot" />{draftVersion}</span>
          <button className="btn-action primary" onClick={onContinue} type="button">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
            Run Agency Review
          </button>
          <button className="btn-action secondary" onClick={() => dispatchAgentMessage("Regenerate this itinerary draft.")} type="button">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 12a9 9 0 109-9 9.75 9.75 0 00-6.74 2.74L3 8" /><path d="M3 3v5h5" /></svg>
            Regenerate
          </button>
        </div>
        {(mapMarkers.length > 0 || latestEstimate) && (
          <div className="live-telemetry">
            {mapMarkers.length > 0 && <span className="telemetry-chip">{mapMarkers.length} live markers</span>}
            {latestEstimate && <span className="telemetry-chip">Route {formatDistance(latestEstimate.distanceMeters)} | {formatDuration(latestEstimate.durationSeconds)}</span>}
          </div>
        )}
      </header> */}

      <div className={`hover-container ${isMinimized ? "minimized" : ""}`} style={{ transform: `translate(${position.x}px, ${position.y}px)`, right: "auto", bottom: "auto" }}>
        <article className="itinerary-floating-card">
          <header className="card-head" onMouseDown={(e) => { if (e.target.closest(".drag-handle") || e.target.closest(".card-head")) { setIsDragging(true); dragStartPos.current = { x: e.clientX - position.x, y: e.clientY - position.y }; } }}>
            <div className="drag-indicator drag-handle"><span /><span /><span /></div>
            <div className="head-main">
              <div className="title-row">
                <svg className="nav-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="3 11 22 2 13 21 11 13 3 11" /></svg>
                <h2>{panelTitle}</h2>
              </div>
              {panelSummary && <p className="subtitle">{panelSummary}</p>}
            </div>
            <button className="minimize-btn" onClick={() => setIsMinimized(!isMinimized)}>
              {isMinimized ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 3 21 3 21 9" /><polyline points="9 21 3 21 3 15" /><line x1="21" y1="3" x2="14" y2="10" /><line x1="3" y1="21" x2="10" y2="14" /></svg> : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12" /></svg>}
            </button>
          </header>

          {!isMinimized && (
            <>
              <div className="timeline-container">
                {safeDays.length > 0 ? (
                  <div className="timeline-list">
                    {safeDays.map((day, dIdx) => (
                      <div key={day.id || day.dayNumber || dIdx} className="day-group">
                        <div className="day-header"><span className="day-badge">Day {day.dayNumber}</span><span className="day-title">{day.title}</span></div>
                        {(day.items || []).length > 0 ? (day.items.map((item, iIdx) => {
                          const gIdx = mapItems.findIndex(m => m.__dayNumber === day.dayNumber && m.__itemIndex === iIdx);
                          return (
                            <div
                              key={`${day.dayNumber}-${iIdx}`}
                              className={`timeline-item ${activeStopIndex === gIdx ? "active" : ""}`}
                              onMouseEnter={() => setActiveStopIndex(gIdx)}
                              onClick={() => onPlaceSelect?.(mapItems[gIdx]?.__placeEntityId)}
                            >
                              <div className="timeline-rail"><span className={`timeline-dot ${activeStopIndex === gIdx ? "active" : ""}`} /><div className="timeline-line" /></div>
                              <div className="timeline-content">
                                <div className="item-time"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>{getItemTimeLabel(item)}</div>
                                <h3>{item.title || "Untitled"}</h3>
                                {item.description && <p>{item.description}</p>}
                              </div>
                            </div>
                          );
                        })) : <div className="empty-day-placeholder"><div className="timeline-rail"><span className="timeline-dot empty" /><div className="timeline-line dashed" /></div><p>No activities planned.</p></div>}
                      </div>
                    ))}
                  </div>
                ) : <div className="empty-itinerary"><p>No active itinerary generated.</p></div>}
              </div>
              <footer className="card-footer"><button type="button" className="send-client-btn" onClick={onContinue}>Send to Client</button></footer>
            </>
          )}
        </article>
      </div>

    </div>
  );
}
