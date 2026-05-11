import React, { useEffect, useMemo, useRef, useState } from "react";
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
  primaryActionLabel = "Send to Client",
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
    <div className="relative bg-primary rounded-[22px] border border-border h-full min-h-0 overflow-hidden shadow-strong" ref={containerRef}>
      {/* map background */}
      <div className="absolute inset-0 z-0">
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

      {/* <header className="absolute top-2 right-2 z-[15] flex flex-col items-end gap-2">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-2 px-4 py-2 bg-white/90 backdrop-blur-[12px] border border-border rounded-pill text-[13px] font-bold text-text-primary shadow-soft"><span className="w-2 h-2 bg-secondary rounded-pill" />{draftVersion}</span>
          <button className="inline-flex items-center gap-2 px-[18px] py-2.5 rounded-pill text-[13px] font-bold cursor-pointer border-none transition-all ease bg-secondary text-white shadow-[0_8px_16px_rgba(215,122,97,0.25)] hover:opacity-90 hover:-translate-y-px" onClick={onContinue} type="button">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
            Run Agency Review
          </button>
          <button className="inline-flex items-center gap-2 px-[18px] py-2.5 rounded-pill text-[13px] font-bold cursor-pointer transition-all ease bg-white/90 text-text-primary border border-border backdrop-blur-[12px] hover:bg-white hover:border-border" onClick={() => dispatchAgentMessage("Regenerate this itinerary draft.")} type="button">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 12a9 9 0 109-9 9.75 9.75 0 00-6.74 2.74L3 8" /><path d="M3 3v5h5" /></svg>
            Regenerate
          </button>
        </div>
        {(mapMarkers.length > 0 || latestEstimate) && (
          <div className="flex items-center justify-end gap-2 flex-wrap max-w-[min(100%,440px)]">
            {mapMarkers.length > 0 && <span className="inline-flex items-center px-2.5 py-1.5 rounded-pill bg-white/[0.92] border border-border text-text-primary text-[11px] font-bold shadow-soft whitespace-nowrap">{mapMarkers.length} live markers</span>}
            {latestEstimate && <span className="inline-flex items-center px-2.5 py-1.5 rounded-pill bg-white/[0.92] border border-border text-text-primary text-[11px] font-bold shadow-soft whitespace-nowrap">Route {formatDistance(latestEstimate.distanceMeters)} | {formatDuration(latestEstimate.durationSeconds)}</span>}
          </div>
        )}
      </header> */}

      {/* floating draggable card */}
      <div
        className={`absolute pointer-events-none flex items-start z-20 will-change-transform ${isMinimized ? "w-[300px]" : "w-[440px]"}`}
        style={{ transform: `translate(${position.x}px, ${position.y}px)`, right: "auto", bottom: "auto" }}
      >
        <article className="w-full bg-[rgba(34,56,67,0.96)] backdrop-blur-[16px] border border-white/10 rounded-[24px] text-white flex flex-col max-h-[calc(100vh-280px)] pointer-events-auto shadow-[0_24px_48px_rgba(34,56,67,0.4)] overflow-hidden">
          {/* card header / drag handle */}
          <header
            className="px-5 py-3.5 cursor-grab select-none flex items-center gap-3 border-b border-white/[0.05] active:cursor-grabbing"
            onMouseDown={(e) => { if (e.target.closest(".drag-handle") || e.target.closest("header")) { setIsDragging(true); dragStartPos.current = { x: e.clientX - position.x, y: e.clientY - position.y }; } }}
          >
            {/* drag indicator */}
            <div className="drag-handle flex flex-col gap-[3px]">
              <span className="w-3.5 h-0.5 bg-white/20 rounded-[2px]" />
              <span className="w-3.5 h-0.5 bg-white/20 rounded-[2px]" />
              <span className="w-3.5 h-0.5 bg-white/20 rounded-[2px]" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <svg className="text-secondary drop-shadow-[0_0_8px_rgba(215,122,97,0.4)]" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="3 11 22 2 13 21 11 13 3 11" /></svg>
                <h2 className="m-0 text-lg font-normal tracking-[0.02em] font-serif text-white">{panelTitle}</h2>
              </div>
              {panelSummary && <p className="m-0 text-white/60 text-[13px]">{panelSummary}</p>}
            </div>
            <button
              className="bg-white/[0.05] border border-white/10 rounded-lg w-8 h-8 flex items-center justify-center text-white/60 cursor-pointer transition-all duration-200 hover:bg-secondary/15 hover:text-secondary hover:border-secondary/30"
              onClick={() => setIsMinimized(!isMinimized)}
            >
              {isMinimized
                ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 3 21 3 21 9" /><polyline points="9 21 3 21 3 15" /><line x1="21" y1="3" x2="14" y2="10" /><line x1="3" y1="21" x2="10" y2="14" /></svg>
                : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12" /></svg>
              }
            </button>
          </header>

          {!isMinimized && (
            <>
              {/* timeline */}
              <div className="flex-1 overflow-y-auto px-7 pb-5 max-h-[420px]">
                {safeDays.length > 0 ? (
                  <div className="flex flex-col">
                    {safeDays.map((day, dIdx) => (
                      <div key={day.id || day.dayNumber || dIdx} className="mb-8">
                        <div className="flex items-center gap-3 mb-5 sticky top-0 bg-[rgba(34,56,67,0.01)] py-1 z-[5]">
                          <span className="bg-secondary text-white px-3 py-1 rounded-pill text-[11px] font-extrabold tracking-[0.05em] uppercase">Day {day.dayNumber}</span>
                          <span className="font-serif text-lg text-white">{day.title}</span>
                        </div>
                        {(day.items || []).length > 0 ? (day.items.map((item, iIdx) => {
                          const gIdx = mapItems.findIndex(m => m.__dayNumber === day.dayNumber && m.__itemIndex === iIdx);
                          return (
                            <div
                              key={`${day.dayNumber}-${iIdx}`}
                              className={`flex gap-5 cursor-pointer`}
                              onMouseEnter={() => setActiveStopIndex(gIdx)}
                              onClick={() => onPlaceSelect?.(mapItems[gIdx]?.__placeEntityId)}
                            >
                              {/* timeline rail */}
                              <div className="flex flex-col items-center w-3 pt-2">
                                <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 transition-all duration-200 ${activeStopIndex === gIdx ? "bg-secondary shadow-[0_0_0_4px_rgba(215,122,97,0.3)] scale-[1.2]" : "bg-white/20"}`} />
                                <div className="w-0.5 flex-1 bg-white/10 my-1" />
                              </div>
                              {/* content */}
                              <div className="flex-1 pb-6">
                                <div className="flex items-center gap-1.5 text-xs font-semibold text-white/50 mb-1.5">
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                                  {getItemTimeLabel(item)}
                                </div>
                                <h3 className="m-0 mb-2 text-white font-bold text-base leading-[1.25] tracking-normal">{item.title || "Untitled"}</h3>
                                {item.description && <p className="m-0 text-white/[0.82] text-sm leading-[1.5]">{item.description}</p>}
                              </div>
                            </div>
                          );
                        })) : (
                          <div className="flex gap-5 text-white/35 italic text-[13px]">
                            <div className="flex flex-col items-center w-3 pt-2">
                              <span className="w-2 h-2 rounded-full bg-white/10" />
                              <div className="w-0.5 flex-1 my-1" style={{ background: "repeating-linear-gradient(to bottom, rgba(255,255,255,0.1) 0, rgba(255,255,255,0.1) 4px, transparent 4px, transparent 8px)" }} />
                            </div>
                            <p>No activities planned.</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-10 text-center text-white/50">
                    <p>No active itinerary generated.</p>
                  </div>
                )}
              </div>
              {/* footer */}
              <footer className="px-7 pb-7">
                <button
                  type="button"
                  className="w-full py-3.5 bg-secondary text-white border-none rounded-[14px] text-sm font-bold cursor-pointer transition-all ease duration-200 shadow-[0_10px_20px_rgba(215,122,97,0.2)] hover:-translate-y-px hover:shadow-[0_12px_24px_rgba(215,122,97,0.3)]"
                  onClick={onContinue}
                >
                  {primaryActionLabel}
                </button>
              </footer>
            </>
          )}
        </article>
      </div>

    </div>
  );
}
