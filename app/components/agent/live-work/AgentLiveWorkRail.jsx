"use client";
import { useState } from 'react';
import AgentTaskList from './AgentTaskList';
import AgentToolCallList from './AgentToolCallList';
import AgentSourcesDrawer from '../sources/AgentSourcesDrawer';
import ItineraryCanvas from '../itinerary/ItineraryCanvas';

export default function AgentLiveWorkRail({ 
  runStatus = 'idle',
  tasks = [], 
  toolCalls = [], 
  sources = [], 
  itinerary = null 
}) {
  const [activeTab, setActiveTab] = useState('work');

  return (
    <div className="live-work-rail">
      <header className="rail-status-header">
        <div className="status-indicator">
          <span className={`pulse-dot ${runStatus}`}></span>
          <span className="status-text">
            {runStatus === 'running' ? 'Agent Active' : runStatus === 'idle' ? 'Idle' : 'Run ' + runStatus}
          </span>
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
