import { useState, useMemo, useEffect } from "react";
import "./ClientItineraryPage.css";
import { fetchItineraryDraft } from "../../../lib/api.js";
import ItineraryDraftPanel from "../itinerary/ItineraryDraftPanel.jsx";

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
        map.set(clientName, { id: clientName, name: clientName, trips: [] });
      }
      map.get(clientName).trips.push(trip);
    });
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [agencyTrips]);

  const filteredClients = clients.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()));
  const selectedClient = clients.find(c => c.id === selectedClientId) || null;
  const selectedTrip = selectedClient?.trips.find(t => t.id === selectedTripId) || null;

  useEffect(() => {
    if (!agencyId || !selectedTripId) { setFullItinerary(null); return; }
    const trip = agencyTrips.find(t => t.id === selectedTripId);
    if (!trip || !trip.itineraryId) { setFullItinerary(null); return; }

    setIsLoadingItinerary(true);
    fetchItineraryDraft(agencyId, trip.itineraryId)
      .then(res => setFullItinerary(res?.itinerary ?? res ?? null))
      .catch(err => { console.error(err); setFullItinerary(null); })
      .finally(() => setIsLoadingItinerary(false));
  }, [agencyId, selectedTripId, agencyTrips]);

  return (
    <div className="client-itinerary-surface">
      <aside className="client-sidebar-pane">
        <div className="pane-header">
          <h3 className="section-title">Client Directory</h3>
          <div className="search-box">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
            <input type="text" placeholder="Search clients..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="search-input" />
          </div>
        </div>
        <div className="client-list">
          {filteredClients.map(c => {
            const initials = c.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
            return (
              <button key={c.id} className={`client-card ${selectedClientId === c.id ? 'active' : ''}`} onClick={() => { setSelectedClientId(c.id); setSelectedTripId(c.trips[0]?.id || null); }}>
                <div className="client-avatar">{initials}</div>
                <div className="client-info"><strong>{c.name}</strong><span>{c.trips.length} trips</span></div>
              </button>
            );
          })}
        </div>
      </aside>

      <main className="workspace-pane">
        {selectedClient ? (
          <div className="workspace-content">
            <header className="workspace-header">
              <div className="client-meta"><h2>{selectedClient.name}</h2><span className="client-badge">Client Portfolio</span></div>
            </header>
            <div className="workspace-layout">
              <div className="trip-strip">
                {selectedClient.trips.map(t => (
                  <button key={t.id} className={`trip-card ${selectedTripId === t.id ? 'active' : ''}`} onClick={() => setSelectedTripId(t.id)}>
                    <div className="trip-card-body"><strong>{t.destination || "Unnamed Trip"}</strong><span className="trip-dates">{t.dates || "TBD"}</span></div>
                  </button>
                ))}
              </div>
              <div className="itinerary-preview-area">
                {isLoadingItinerary ? <div className="empty-workspace"><div className="loading-spinner" /><p>Fetching itinerary details...</p></div> : 
                 fullItinerary ? <div className="itinerary-details-wrapper"><ItineraryDraftPanel itinerary={fullItinerary} draftDays={fullItinerary.days || []} draftVersion={fullItinerary.version ? `Draft v${fullItinerary.version}` : "Draft"} tripSummary={selectedTrip} /></div> :
                 <div className="empty-workspace"><p>Select a trip to view its full itinerary.</p></div>}
              </div>
            </div>
          </div>
        ) : (
          <div className="empty-workspace">
            <div className="empty-state-icon"><svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg></div>
            <h3>Client Portfolio</h3><p>Select a client from the directory to manage their itineraries.</p>
          </div>
        )}
      </main>

    </div>
  );
}
