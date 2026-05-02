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

export default function ItineraryDraftPanel({
  draftDays,
  draftVersion,
  onContinue = () => {},
  dispatchAgentMessage,
  tripSummary = null,
}) {
  const safeDays = Array.isArray(draftDays) ? draftDays : [];
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
  const [position, setPosition] = useState({ x: 24, y: 76 });
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
                <h2>Live Itinerary</h2>
              </div>
              {!isMinimized && <p className="subtitle">Interactive Itinerary Preview</p>}
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
                            {item.time || "09:00 AM"}
                          </div>
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
          background: #0a0e14;
          border-radius: 22px;
          border: 1px solid #e6e9ee;
          height: 100%;
          min-height: 0;
          overflow: hidden;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
        }

        .map-background {
          position: absolute;
          inset: 0;
          z-index: 0;
        }

        .panel-header {
          position: absolute;
          top: 24px;
          right: 24px;
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
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(8px);
          border: 1px solid #e5e7eb;
          border-radius: 999px;
          font-size: 13px;
          font-weight: 700;
          color: #111827;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
        }

        .dot {
          width: 8px;
          height: 8px;
          background: #f59e0b;
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
          background: #b65d48;
          color: white;
          box-shadow: 0 8px 16px rgba(182, 93, 72, 0.25);
        }

        .btn-action.primary:hover {
          background: #a14e3b;
          transform: translateY(-1px);
        }

        .btn-action.secondary {
          background: rgba(255, 255, 255, 0.95);
          color: #374151;
          border: 1px solid #e5e7eb;
        }

        .btn-action.secondary:hover {
          background: white;
          border-color: #d1d5db;
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
          background: rgba(18, 20, 24, 0.96);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 24px;
          color: white;
          display: flex;
          flex-direction: column;
          max-height: calc(100vh - 200px);
          pointer-events: auto;
          box-shadow: 0 24px 48px rgba(0, 0, 0, 0.4);
          overflow: hidden;
        }

        .card-head {
          padding: 24px 28px 20px;
          cursor: grab;
          user-select: none;
          display: flex;
          align-items: flex-start;
          gap: 16px;
        }

        .card-head:active {
          cursor: grabbing;
        }

        .drag-indicator {
          display: flex;
          flex-direction: column;
          gap: 3px;
          padding-top: 8px;
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
          color: #94a3b8;
          cursor: pointer;
          transition: all 0.2s;
        }

        .minimize-btn:hover {
          background: rgba(255, 255, 255, 0.1);
          color: white;
        }

        .title-row {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 4px;
        }

        .nav-icon {
          color: #3b82f6;
        }

        .card-head h2 {
          margin: 0;
          font-size: 20px;
          font-weight: 700;
          letter-spacing: -0.01em;
        }

        .subtitle {
          margin: 0;
          color: #94a3b8;
          font-size: 13px;
        }

        .timeline-container {
          flex: 1;
          overflow-y: auto;
          padding: 0 28px 20px;
          max-height: 500px;
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
          background: #475569;
          transition: all 0.2s ease;
          flex-shrink: 0;
        }

        .timeline-dot.active {
          background: #3b82f6;
          box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.3);
          transform: scale(1.2);
        }

        .timeline-line {
          width: 2px;
          flex: 1;
          background: rgba(71, 85, 105, 0.4);
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
          color: #94a3b8;
          margin-bottom: 6px;
        }

        .timeline-content h3 {
          margin: 0 0 6px;
          font-size: 16px;
          font-weight: 600;
          color: #f8fafc;
        }

        .timeline-content p {
          margin: 0;
          font-size: 13px;
          color: #64748b;
          line-height: 1.6;
        }

        .empty-itinerary {
          padding: 40px 0;
          text-align: center;
          color: #64748b;
        }

        .card-footer {
          padding: 0 28px 28px;
        }

        .send-client-btn {
          width: 100%;
          padding: 14px;
          background: #2563eb;
          color: white;
          border: none;
          border-radius: 14px;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        :global(.itinerary-live-map) {
          position: absolute !important;
          inset: 0;
          height: 100% !important;
          width: 100% !important;
          z-index: 0;
        }

        :global(.leaflet-container) {
          background: #f1f5f9 !important;
        }
      `}</style>
    </div>
  );
}
