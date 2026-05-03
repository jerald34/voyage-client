import { useState, useMemo, useEffect } from "react";
import { fetchItineraryDraft } from "../../lib/api.js";
import ItineraryDraftPanel from "./ItineraryDraftPanel.jsx";

export default function ClientItineraryPage({ agencyTrips = [], agencyId }) {
  const [selectedClientId, setSelectedClientId] = useState(null);
  const [selectedTripId, setSelectedTripId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [fullItinerary, setFullItinerary] = useState(null);
  const [isLoadingItinerary, setIsLoadingItinerary] = useState(false);

  const clients = useMemo(() => {
    const map = new Map();
    agencyTrips.forEach(trip => {
      if (!trip.clientName) return;
      const clientName = trip.clientName.trim();
      if (!map.has(clientName)) {
        map.set(clientName, {
          id: clientName, // Using name as ID for now
          name: clientName,
          trips: []
        });
      }
      map.get(clientName).trips.push(trip);
    });
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [agencyTrips]);

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedClient = useMemo(() => 
    clients.find(c => c.id === selectedClientId) || null
  , [clients, selectedClientId]);

  const selectedTrip = useMemo(() => 
    selectedClient?.trips.find(t => t.id === selectedTripId) || null
  , [selectedClient, selectedTripId]);

  useEffect(() => {
    if (!agencyId || !selectedTripId) {
      setFullItinerary(null);
      return;
    }

    const trip = agencyTrips.find(t => t.id === selectedTripId);
    if (!trip || !trip.itineraryId) {
      setFullItinerary(null);
      return;
    }

    setIsLoadingItinerary(true);
    fetchItineraryDraft(agencyId, trip.itineraryId)
      .then(result => {
        setFullItinerary(result?.itinerary ?? result ?? null);
      })
      .catch(err => {
        console.error("Failed to fetch itinerary draft:", err);
        setFullItinerary(null);
      })
      .finally(() => {
        setIsLoadingItinerary(false);
      });
  }, [agencyId, selectedTripId, agencyTrips]);

  return (
    <div className="client-itinerary-surface">
      <aside className="client-sidebar-pane">
        <div className="pane-header">
          <h3 className="section-title">Client Directory</h3>
          <div className="search-box">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <input 
              type="text" 
              placeholder="Search clients..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>
        </div>
        <div className="client-list">
          {filteredClients.map(client => {
            const initials = client.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
            return (
              <button 
                key={client.id}
                className={`client-card ${selectedClientId === client.id ? 'active' : ''}`}
                onClick={() => {
                  setSelectedClientId(client.id);
                  setSelectedTripId(client.trips[0]?.id || null);
                }}
              >
                <div className="client-avatar">{initials}</div>
                <div className="client-info">
                  <strong>{client.name}</strong>
                  <span>{client.trips.length} {client.trips.length === 1 ? 'trip' : 'trips'}</span>
                </div>
              </button>
            );
          })}
          {filteredClients.length === 0 && (
            <div className="empty-results">
              <p>No clients found matching "{searchQuery}"</p>
            </div>
          )}
        </div>
      </aside>

      <main className="workspace-pane">
        {selectedClient ? (
          <div className="workspace-content">
            <header className="workspace-header">
              <div className="client-meta">
                <h2>{selectedClient.name}</h2>
                <span className="client-badge">Client Portfolio</span>
              </div>
            </header>
            
            <div className="workspace-layout">
              <div className="trip-strip">
                {selectedClient.trips.map(trip => (
                  <button 
                    key={trip.id}
                    className={`trip-card ${selectedTripId === trip.id ? 'active' : ''}`}
                    onClick={() => setSelectedTripId(trip.id)}
                  >
                    <div className="trip-card-body">
                      <strong>{trip.destination || "Unnamed Trip"}</strong>
                      <span className="trip-dates">{trip.dates || "TBD"}</span>
                    </div>
                  </button>
                ))}
              </div>
              
              <div className="itinerary-preview-area">
                {isLoadingItinerary ? (
                  <div className="empty-workspace">
                    <div className="loading-spinner" />
                    <p>Fetching itinerary details...</p>
                  </div>
                ) : fullItinerary ? (
                  <div className="itinerary-details-wrapper">
                    <ItineraryDraftPanel 
                      itinerary={fullItinerary}
                      draftDays={fullItinerary.days || []}
                      draftVersion={fullItinerary.version ? `Draft v${fullItinerary.version}` : "Draft"}
                      tripSummary={selectedTrip}
                    />
                  </div>
                ) : selectedTripId ? (
                  <div className="empty-workspace">
                    <p>No detailed itinerary found for this trip.</p>
                  </div>
                ) : (
                  <div className="empty-workspace">
                    <p>Select a trip to view its full itinerary.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="empty-workspace">
            <div className="empty-state-icon">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" aria-hidden="true">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <h3>Client Portfolio</h3>
            <p>Select a client from the directory to manage their itineraries.</p>
          </div>
        )}
      </main>

      <style jsx>{`
        .client-itinerary-surface {
          display: grid;
          grid-template-columns: 320px 1fr;
          gap: 20px;
          height: calc(100vh - 140px);
          min-height: 0;
        }

        .client-sidebar-pane {
          background: var(--bg-glass);
          backdrop-filter: blur(18px);
          border: 1px solid var(--voyage-border);
          border-radius: 20px;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          box-shadow: var(--voyage-shadow-soft);
        }

        .pane-header {
          padding: 24px;
          border-bottom: 1px solid var(--voyage-border);
          background: rgba(255, 255, 255, 0.4);
        }

        .section-title {
          font-family: "DM Serif Display", serif;
          font-size: 1.4rem;
          color: var(--voyage-primary);
          margin-bottom: 16px;
        }

        .search-box {
          position: relative;
          display: flex;
          align-items: center;
        }

        .search-box svg {
          position: absolute;
          left: 12px;
          color: var(--voyage-text-soft);
        }

        .search-input {
          width: 100%;
          padding: 10px 12px 10px 36px;
          border-radius: 12px;
          border: 1px solid var(--voyage-border);
          background: rgba(255, 255, 255, 0.8);
          font-size: 0.9rem;
          transition: all 0.2s ease;
        }

        .search-input:focus {
          outline: none;
          border-color: var(--voyage-secondary);
          background: white;
          box-shadow: 0 0 0 4px rgba(215, 122, 97, 0.1);
        }

        .client-list {
          flex: 1;
          overflow-y: auto;
          padding: 12px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .client-card {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 12px;
          border: none;
          background: transparent;
          cursor: pointer;
          border-radius: 14px;
          text-align: left;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .client-card:hover {
          background: rgba(255, 255, 255, 0.5);
          transform: translateX(4px);
        }

        .client-card.active {
          background: var(--voyage-primary);
          color: white;
          box-shadow: 0 8px 16px rgba(34, 56, 67, 0.15);
        }

        .client-avatar {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          background: var(--voyage-secondary);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 0.9rem;
          flex-shrink: 0;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        }

        .client-card.active .client-avatar {
          background: var(--voyage-accent);
          color: var(--voyage-primary);
        }

        .client-info strong {
          display: block;
          font-size: 1rem;
          letter-spacing: -0.01em;
        }

        .client-info span {
          font-size: 0.75rem;
          font-weight: 600;
          opacity: 0.7;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .workspace-pane {
          background: var(--bg-glass);
          backdrop-filter: blur(18px);
          border: 1px solid var(--voyage-border);
          border-radius: 20px;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          box-shadow: var(--voyage-shadow-soft);
        }

        .workspace-content {
          display: flex;
          flex-direction: column;
          height: 100%;
        }

        .workspace-header {
          padding: 24px;
          background: rgba(255, 255, 255, 0.4);
          border-bottom: 1px solid var(--voyage-border);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .client-meta h2 {
          font-family: "DM Serif Display", serif;
          font-size: 1.8rem;
          margin-bottom: 4px;
        }

        .client-badge {
          font-size: 0.7rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.15em;
          color: var(--voyage-secondary);
        }

        .workspace-layout {
          display: flex;
          flex-direction: column;
          flex: 1;
          min-height: 0;
        }

        .trip-strip {
          display: flex;
          gap: 16px;
          padding: 20px 24px;
          background: rgba(255, 255, 255, 0.2);
          border-bottom: 1px solid var(--voyage-border);
          overflow-x: auto;
          scrollbar-width: thin;
        }

        .trip-card {
          min-width: 220px;
          padding: 16px;
          border-radius: 16px;
          border: 1px solid var(--voyage-border);
          background: white;
          text-align: left;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 2px 4px rgba(0,0,0,0.02);
        }

        .trip-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 16px rgba(0,0,0,0.05);
          border-color: var(--voyage-accent);
        }

        .trip-card.active {
          border-color: var(--voyage-secondary);
          background: linear-gradient(180deg, white, #fffafa);
          box-shadow: 0 8px 24px rgba(215, 122, 97, 0.12);
        }

        .trip-card-body strong {
          display: block;
          font-size: 1.05rem;
          color: var(--voyage-primary);
          margin-bottom: 4px;
        }

        .trip-dates {
          font-size: 0.8rem;
          color: var(--voyage-text-soft);
          font-weight: 600;
        }

        .itinerary-preview-area {
          flex: 1;
          overflow-y: auto;
          padding: 32px;
          background: rgba(255, 255, 255, 0.1);
        }

        .itinerary-details-wrapper {
          height: 100%;
          border-radius: 24px;
          overflow: hidden;
          background: white;
          box-shadow: 0 12px 32px rgba(0,0,0,0.08);
        }

        :global(.itinerary-details-wrapper .itinerary-draft-panel) {
          border: none;
          border-radius: 0;
        }

        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 3px solid rgba(215, 122, 97, 0.1);
          border-top-color: var(--voyage-secondary);
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 16px;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .empty-workspace {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          color: var(--voyage-text-soft);
          gap: 20px;
          text-align: center;
          padding: 40px;
        }

        .empty-state-icon {
          color: var(--voyage-accent);
          opacity: 0.5;
        }

        .empty-workspace h3 {
          font-family: "DM Serif Display", serif;
          font-size: 2rem;
          color: var(--voyage-primary);
        }

        .empty-results {
          padding: 20px;
          text-align: center;
          color: var(--voyage-text-soft);
          font-style: italic;
        }
      `}</style>
    </div>
  );
}
