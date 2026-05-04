import React, { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";

const ItineraryLiveMap = dynamic(() => import("./ItineraryLiveMap.jsx"), {
  ssr: false,
});

function getTripSummaryValue(tripSummary, key, fallback) {
  const value = tripSummary?.[key];
  if (typeof value === "string" && value.trim()) {
    return value;
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }
  return fallback;
}

function getItemTimeLabel(item) {
  if (typeof item?.time === "string" && item.time.trim()) {
    return item.time;
  }
  if (item?.startTime && item?.endTime) {
    return `${item.startTime} - ${item.endTime}`;
  }
  if (item?.startTime) {
    return item.startTime;
  }
  if (item?.endTime) {
    return `Ends ${item.endTime}`;
  }
  return "Time pending";
}

export default function ItineraryDraftPanel({
  itinerary = null,
  draftDays,
  draftVersion,
  onContinue = () => {},
  dispatchAgentMessage,
  tripSummary = null,
}) {
  const itineraryDays = Array.isArray(itinerary?.days) ? itinerary.days : draftDays;
  const safeDays = Array.isArray(itineraryDays) ? itineraryDays : [];
  const panelTitle = itinerary?.title || "Live Itinerary";
  const panelSummary = itinerary?.summary || "";
  const mapItems = useMemo(
    () =>
      safeDays.reduce((acc, day) => {
        if (Array.isArray(day?.items) && day.items.length > 0) {
          day.items.forEach((item, itemIndex) => {
            acc.push({
              ...item,
              __dayNumber: day?.dayNumber || null,
              __dayTitle: day?.title || "",
              __itemIndex: itemIndex,
            });
          });
        }
        return acc;
      }, []),
    [safeDays]
  );

  const [activeStopIndex, setActiveStopIndex] = useState(mapItems.length > 0 ? 0 : -1);
  const [isMinimized, setIsMinimized] = useState(false);
  const [position, setPosition] = useState({ x: 8, y: 56 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const containerRef = useRef(null);

  useEffect(() => {
    setActiveStopIndex(mapItems.length > 0 ? 0 : -1);
  }, [mapItems.length]);

  const onMouseDown = (e) => {
    // Only drag from header or specific handle
    if (e.target.closest(".drag-handle") || e.target.closest(".card-head")) {
      setIsDragging(true);
      dragStartPos.current = {
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      };
    }
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging) return;
      
      const newX = e.clientX - dragStartPos.current.x;
      const newY = e.clientY - dragStartPos.current.y;
      
      // Basic boundary checks within the panel
      if (containerRef.current) {
        const bounds = containerRef.current.getBoundingClientRect();
        const cardWidth = 440;
        const cardHeight = isMinimized ? 80 : 600; // rough estimates
        
        const clampedX = Math.max(0, Math.min(newX, bounds.width - cardWidth));
        const clampedY = Math.max(0, Math.min(newY, bounds.height - 80));
        
        setPosition({ x: clampedX, y: clampedY });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, isMinimized]);

  return (
    <div className="itinerary-draft-panel" ref={containerRef}>
      <div className="map-background">
        <ItineraryLiveMap items={mapItems} activeIndex={activeStopIndex} onHoverItem={setActiveStopIndex} />
      </div>

      <header className="panel-header">
        <div className="header-actions">
          <span className="draft-version-tag">
            <span className="dot" />
            {draftVersion}
          </span>
          <button className="btn-action primary" onClick={onContinue} type="button">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            Run Agency Review
          </button>
          <button
            className="btn-action secondary"
            onClick={() => dispatchAgentMessage("Regenerate this itinerary draft.")}
            type="button"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M3 12a9 9 0 109-9 9.75 9.75 0 00-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
            </svg>
            Regenerate
          </button>
        </div>
      </header>

      <div 
        className={`hover-container ${isMinimized ? "minimized" : ""}`}
        style={{
          transform: `translate(${position.x}px, ${position.y}px)`,
          right: "auto",
          bottom: "auto"
        }}
      >
        <article className="itinerary-floating-card">
          <header className="card-head" onMouseDown={onMouseDown}>
            <div className="drag-indicator drag-handle">
              <span /><span /><span />
            </div>
            <div className="head-main">
              <div className="title-row">
                <svg className="nav-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polygon points="3 11 22 2 13 21 11 13 3 11" />
                </svg>
                <h2>{panelTitle}</h2>
              </div>
              {panelSummary ? <p className="subtitle">{panelSummary}</p> : null}
            </div>
            <button 
              className="minimize-btn" 
              onClick={() => setIsMinimized(!isMinimized)}
              aria-label={isMinimized ? "Expand" : "Minimize"}
            >
              {isMinimized ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="15 3 21 3 21 9" /><polyline points="9 21 3 21 3 15" />
                  <line x1="21" y1="3" x2="14" y2="10" /><line x1="3" y1="21" x2="10" y2="14" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              )}
            </button>
          </header>

          {!isMinimized && (
            <>
              <div className="timeline-container">
                {mapItems.length > 0 ? (
                  <div className="timeline-list">
                    {mapItems.map((item, index) => (
                      <div
                        key={`${item.__dayNumber ?? "day"}-${item.__itemIndex ?? index}`}
                        className={`timeline-item ${activeStopIndex === index ? "active" : ""}`}
                        onMouseEnter={() => setActiveStopIndex(index)}
                      >
                        <div className="timeline-rail">
                          <span className={`timeline-dot ${activeStopIndex === index ? "active" : ""}`} />
                          {index < mapItems.length - 1 && <div className="timeline-line" />}
                        </div>
                        <div className="timeline-content">
                          <div className="item-time">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <circle cx="12" cy="12" r="10" />
                              <polyline points="12 6 12 12 16 14" />
                            </svg>
                            {getItemTimeLabel(item)}
                          </div>
                          {item.__dayNumber ? (
                            <div className="day-label">
                              Day {item.__dayNumber}{item.__dayTitle ? `: ${item.__dayTitle}` : ""}
                            </div>
                          ) : null}
                          <h3>{item.title || "Planned stop"}</h3>
                          <p>{item.description || "No description provided yet."}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-itinerary">
                    <p>No active itinerary generated. Ask the agent to start drafting.</p>
                  </div>
                )}
              </div>

              <footer className="card-footer">
                <button type="button" className="send-client-btn" onClick={onContinue}>
                  Send to Client
                </button>
              </footer>
            </>
          )}
        </article>
      </div>

      <style jsx>{`
        .itinerary-draft-panel {
          position: relative;
          background: var(--voyage-primary);
          border-radius: 22px;
          border: 1px solid var(--voyage-border);
          height: 100%;
          min-height: 0;
          overflow: hidden;
          box-shadow: var(--voyage-shadow);
        }

        .map-background {
          position: absolute;
          inset: 0;
          z-index: 0;
        }

        .panel-header {
          position: absolute;
          top: 8px;
          right: 8px;
          z-index: 15;
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .draft-version-tag {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(12px);
          border: 1px solid var(--voyage-border);
          border-radius: 999px;
          font-size: 13px;
          font-weight: 700;
          color: var(--voyage-primary);
          box-shadow: var(--voyage-shadow-soft);
        }

        .dot {
          width: 8px;
          height: 8px;
          background: var(--voyage-secondary);
          border-radius: 999px;
        }

        .btn-action {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 18px;
          border-radius: 999px;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          border: none;
          transition: all 0.2s ease;
        }

        .btn-action.primary {
          background: var(--voyage-secondary);
          color: white;
          box-shadow: 0 8px 16px rgba(215, 122, 97, 0.25);
        }

        .btn-action.primary:hover {
          opacity: 0.9;
          transform: translateY(-1px);
        }

        .btn-action.secondary {
          background: rgba(255, 255, 255, 0.9);
          color: var(--voyage-primary);
          border: 1px solid var(--voyage-border);
          backdrop-filter: blur(12px);
        }

        .btn-action.secondary:hover {
          background: white;
          border-color: var(--voyage-border-strong);
        }

        .hover-container {
          position: absolute;
          width: 440px;
          pointer-events: none;
          display: flex;
          align-items: flex-start;
          z-index: 20;
          will-change: transform;
        }

        .hover-container.minimized {
          width: 300px;
        }

        .itinerary-floating-card {
          width: 100%;
          background: rgba(34, 56, 67, 0.96);
          backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 24px;
          color: white;
          display: flex;
          flex-direction: column;
          max-height: calc(100vh - 280px);
          pointer-events: auto;
          box-shadow: 0 24px 48px rgba(34, 56, 67, 0.4);
          overflow: hidden;
        }

        .card-head {
          padding: 14px 20px;
          cursor: grab;
          user-select: none;
          display: flex;
          align-items: center;
          gap: 12px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }

        .card-head:active {
          cursor: grabbing;
        }

        .drag-indicator {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .drag-indicator span {
          width: 14px;
          height: 2px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 2px;
        }

        .head-main {
          flex: 1;
        }

        .minimize-btn {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: rgba(255, 255, 255, 0.6);
          cursor: pointer;
          transition: all 0.2s;
        }

        .minimize-btn:hover {
          background: rgba(215, 122, 97, 0.15);
          color: var(--voyage-secondary);
          border-color: rgba(215, 122, 97, 0.3);
        }

        .title-row {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 4px;
        }

        .nav-icon {
          color: var(--voyage-secondary);
          filter: drop-shadow(0 0 8px rgba(215, 122, 97, 0.4));
        }

        .card-head h2 {
          margin: 0;
          font-size: 18px;
          font-weight: 400;
          letter-spacing: 0.02em;
          font-family: "DM Serif Display", serif;
          color: white;
        }

        .subtitle {
          margin: 0;
          color: rgba(255, 255, 255, 0.6);
          font-size: 13px;
        }

        .timeline-container {
          flex: 1;
          overflow-y: auto;
          padding: 0 28px 20px;
          max-height: 420px;
        }

        .timeline-list {
          display: flex;
          flex-direction: column;
        }

        .timeline-item {
          display: flex;
          gap: 20px;
          cursor: pointer;
        }

        .timeline-rail {
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 12px;
          padding-top: 8px;
        }

        .timeline-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.2);
          transition: all 0.2s ease;
          flex-shrink: 0;
        }

        .timeline-dot.active {
          background: var(--voyage-secondary);
          box-shadow: 0 0 0 4px rgba(215, 122, 97, 0.3);
          transform: scale(1.2);
        }

        .timeline-line {
          width: 2px;
          flex: 1;
          background: rgba(255, 255, 255, 0.1);
          margin: 4px 0;
        }

        .timeline-content {
          flex: 1;
          padding-bottom: 24px;
        }

        .item-time {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.5);
          margin-bottom: 6px;
        }

        .day-label {
          display: inline-flex;
          align-items: center;
          max-width: 100%;
          margin-bottom: 8px;
          padding: 4px 8px;
          border-radius: 999px;
          background: rgba(215, 122, 97, 0.15);
          color: var(--voyage-secondary);
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.03em;
        }

        .timeline-content h3 {
          margin: 0 0 6px;
          font-size: 16px;
          font-weight: 600;
          color: white;
        }

        .timeline-content p {
          margin: 0;
          font-size: 13px;
          color: rgba(255, 255, 255, 0.6);
          line-height: 1.6;
        }

        .empty-itinerary {
          padding: 40px 0;
          text-align: center;
          color: rgba(255, 255, 255, 0.5);
        }

        .card-footer {
          padding: 0 28px 28px;
        }

        .send-client-btn {
          width: 100%;
          padding: 14px;
          background: var(--voyage-secondary);
          color: white;
          border: none;
          border-radius: 14px;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 10px 20px rgba(215, 122, 97, 0.2);
        }

        .send-client-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 12px 24px rgba(215, 122, 97, 0.3);
        }

        :global(.itinerary-live-map) {
          position: absolute !important;
          inset: 0;
          height: 100% !important;
          width: 100% !important;
          z-index: 0;
        }

        :global(.leaflet-container) {
          background: var(--voyage-background) !important;
        }
        @media (max-width: 900px) {
          .hover-container {
            position: relative !important;
            transform: none !important;
            width: 100% !important;
            padding: 16px;
            z-index: 20;
          }

          .itinerary-floating-card {
            max-height: 500px;
          }

          .panel-header {
            top: 16px;
            right: 16px;
            left: 16px;
          }

          .header-actions {
            justify-content: flex-end;
            width: 100%;
          }

          .btn-action span {
            display: none;
          }

          .btn-action {
            padding: 10px;
          }

          .drag-handle {
            display: none;
          }
        }

        @media (max-width: 600px) {
          .header-actions .draft-version-tag {
            display: none;
          }

          .panel-header {
            top: 12px;
          }

          .timeline-container {
            padding: 0 16px 16px;
          }

          .card-head {
            padding: 16px 20px 12px;
          }
          
          .itinerary-floating-card {
            border-radius: 16px;
          }
        }
      `}</style>
    </div>
  );
}
