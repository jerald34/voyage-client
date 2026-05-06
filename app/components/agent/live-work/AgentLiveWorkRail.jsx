"use client";
import { useState } from 'react';
import AgentTaskList from './AgentTaskList';
import AgentToolCallList from './AgentToolCallList';
import AgentSourcesDrawer from '../sources/AgentSourcesDrawer';
import ItineraryCanvas from '../itinerary/ItineraryCanvas';

function formatDistance(meters) {
  if (!Number.isFinite(meters) || meters <= 0) return null;
  if (meters >= 1000) return `${(meters / 1000).toFixed(meters >= 10000 ? 0 : 1)} km`;
  return `${Math.round(meters)} m`;
}

function formatDuration(seconds) {
  if (!Number.isFinite(seconds) || seconds <= 0) return null;

  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min`;

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
}

export default function AgentLiveWorkRail({ 
  runStatus = 'idle',
  tasks = [], 
  toolCalls = [], 
  sources = [], 
  itinerary = null,
  activeToolLabel = null,
  mapMarkers = [],
  routeEstimates = [],
}) {
  const [activeTab, setActiveTab] = useState('work');
  const latestRouteEstimate = Array.isArray(routeEstimates) && routeEstimates.length > 0 ? routeEstimates[routeEstimates.length - 1] : null;
  const routeDistance = formatDistance(latestRouteEstimate?.distanceMeters);
  const routeDuration = formatDuration(latestRouteEstimate?.durationSeconds);

  return (
    <div className="live-work-rail">
      <header className="rail-status-header">
        <div className="status-stack">
          <div className="status-indicator">
            <span className={`pulse-dot ${runStatus}`}></span>
            <span className="status-text">
              {runStatus === 'running' ? 'Agent Active' : runStatus === 'idle' ? 'Idle' : 'Run ' + runStatus}
            </span>
          </div>
          {(activeToolLabel || mapMarkers.length > 0 || latestRouteEstimate) && (
            <div className="tool-banner" aria-live="polite">
              {activeToolLabel && <span className="tool-banner-label">SYS: {activeToolLabel}</span>}
              {(mapMarkers.length > 0 || latestRouteEstimate) && (
                <span className="tool-banner-meta">
                  {mapMarkers.length > 0 && `${mapMarkers.length} markers`}
                  {mapMarkers.length > 0 && latestRouteEstimate && ' | '}
                  {latestRouteEstimate && `Route${routeDistance ? ` ${routeDistance}` : ''}${routeDuration ? ` | ${routeDuration}` : ''}`}
                </span>
              )}
            </div>
          )}
        </div>
        <div className="run-id-tag">OPERATIONS CENTER</div>
      </header>

      <nav className="rail-tabs">
        <button 
          className={`tab-btn ${activeTab === 'work' ? 'active' : ''}`}
          onClick={() => setActiveTab('work')}
        >
          Process
        </button>
        <button 
          className={`tab-btn ${activeTab === 'itinerary' ? 'active' : ''}`}
          onClick={() => setActiveTab('itinerary')}
        >
          Draft
        </button>
      </nav>

      <div className="rail-content">
        {activeTab === 'work' ? (
          <>
            <AgentTaskList tasks={tasks} />
            <AgentToolCallList toolCalls={toolCalls} />
            <AgentSourcesDrawer sources={sources} />
          </>
        ) : (
          <ItineraryCanvas itinerary={itinerary} />
        )}
      </div>

      <style jsx>{`
        .live-work-rail {
          display: flex;
          flex-direction: column;
          height: 100%;
          background: rgba(255, 255, 255, 0.4);
        }

        .rail-status-header {
          padding: 16px;
          border-bottom: 1px solid var(--voyage-border-strong);
          background: white;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
        }

        .status-stack {
          display: flex;
          flex-direction: column;
          gap: 8px;
          min-width: 0;
        }

        .status-indicator {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .pulse-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--voyage-border-strong);
        }

        .pulse-dot.running {
          background: var(--voyage-secondary);
          animation: pulse 2s infinite;
        }

        .pulse-dot.completed {
          background: #2c7a7b;
        }

        .status-text {
          font-size: 11px;
          font-weight: 800;
          text-transform: uppercase;
          color: var(--voyage-primary);
        }

        .tool-banner {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          align-items: center;
          font-size: 11px;
          line-height: 1.4;
        }

        .tool-banner-label,
        .tool-banner-meta {
          display: inline-flex;
          align-items: center;
          padding: 5px 8px;
          border-radius: 999px;
          background: #0f172a;
          color: #e2e8f0;
          font-weight: 700;
        }

        .tool-banner-label {
          white-space: nowrap;
        }

        .tool-banner-meta {
          background: #eef2f7;
          color: var(--voyage-primary);
          border: 1px solid var(--voyage-border);
        }

        .run-id-tag {
          font-family: var(--font-mono);
          font-size: 10px;
          color: var(--voyage-text-soft);
        }

        .rail-tabs {
          display: flex;
          border-bottom: 1px solid var(--voyage-border-strong);
          background: white;
        }

        .tab-btn {
          flex: 1;
          padding: 12px;
          border: none;
          background: transparent;
          font-size: 11px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--voyage-text-soft);
          cursor: pointer;
          transition: all 0.2s;
        }

        .tab-btn.active {
          color: var(--voyage-primary);
          background: var(--voyage-background);
          box-shadow: inset 0 -2px 0 var(--voyage-secondary);
        }

        .rail-content {
          flex-grow: 1;
          overflow-y: auto;
        }

        @keyframes pulse {
          0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(215, 122, 97, 0.7); }
          70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(215, 122, 97, 0); }
          100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(215, 122, 97, 0); }
        }
      `}</style>
    </div>
  );
}
