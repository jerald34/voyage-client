"use client";
import { useState, useEffect } from 'react';
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

  useEffect(() => {
    if (itinerary) setActiveTab('itinerary');
  }, [itinerary]);
  const latestRouteEstimate = Array.isArray(routeEstimates) && routeEstimates.length > 0 ? routeEstimates[routeEstimates.length - 1] : null;
  const routeDistance = formatDistance(latestRouteEstimate?.distanceMeters);
  const routeDuration = formatDuration(latestRouteEstimate?.durationSeconds);

  const pulseDotClass = runStatus === 'running'
    ? 'w-2 h-2 rounded-full bg-secondary animate-pulse'
    : runStatus === 'completed'
    ? 'w-2 h-2 rounded-full bg-[#2c7a7b]'
    : 'w-2 h-2 rounded-full bg-border';

  return (
    <div className="flex flex-col h-full bg-white/40">
      <header className="px-4 py-4 border-b border-border bg-white flex justify-between items-center gap-4">
        <div className="flex flex-col gap-2 min-w-0">
          <div className="flex items-center gap-2">
            <span className={pulseDotClass}></span>
            <span className="text-[11px] font-extrabold uppercase text-primary">
              {runStatus === 'running' ? 'Agent Active' : runStatus === 'idle' ? 'Idle' : 'Run ' + runStatus}
            </span>
          </div>
          {(activeToolLabel || mapMarkers.length > 0 || latestRouteEstimate) && (
            <div className="flex flex-wrap gap-2 items-center text-[11px] leading-snug" aria-live="polite">
              {activeToolLabel && (
                <span className="inline-flex items-center px-2 py-[5px] rounded-pill bg-[#0f172a] text-[#e2e8f0] font-bold whitespace-nowrap">
                  SYS: {activeToolLabel}
                </span>
              )}
              {(mapMarkers.length > 0 || latestRouteEstimate) && (
                <span className="inline-flex items-center px-2 py-[5px] rounded-pill bg-[#eef2f7] text-primary border border-border font-bold">
                  {mapMarkers.length > 0 && `${mapMarkers.length} markers`}
                  {mapMarkers.length > 0 && latestRouteEstimate && ' | '}
                  {latestRouteEstimate && `Route${routeDistance ? ` ${routeDistance}` : ''}${routeDuration ? ` | ${routeDuration}` : ''}`}
                </span>
              )}
            </div>
          )}
        </div>
        <div className="font-mono text-[10px] text-text-soft shrink-0">OPERATIONS CENTER</div>
      </header>

      <nav className="flex border-b border-border bg-white">
        <button
          className={`flex-1 py-3 border-0 text-[11px] font-extrabold uppercase tracking-[0.05em] cursor-pointer transition-all ${
            activeTab === 'work'
              ? 'text-primary bg-background shadow-[inset_0_-2px_0_rgb(var(--color-secondary))]'
              : 'text-text-soft bg-transparent'
          }`}
          onClick={() => setActiveTab('work')}
        >
          Process
        </button>
        <button
          className={`flex-1 py-3 border-0 text-[11px] font-extrabold uppercase tracking-[0.05em] cursor-pointer transition-all ${
            activeTab === 'itinerary'
              ? 'text-primary bg-background shadow-[inset_0_-2px_0_rgb(var(--color-secondary))]'
              : 'text-text-soft bg-transparent'
          }`}
          onClick={() => setActiveTab('itinerary')}
        >
          Draft
        </button>
      </nav>

      <div className="flex-grow overflow-y-auto">
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
    </div>
  );
}
