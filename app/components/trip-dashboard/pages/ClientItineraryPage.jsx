import { useState, useMemo, useEffect, useRef } from "react";
import "./ClientItineraryPage.css";
import { fetchItineraryDraft } from "../../../lib/api.js";
import {
  getSavedItineraryTrips,
  getSavedStatusLabel,
  getStableItineraryId,
  groupSavedTripsByClient,
  normalizeItineraryResponse,
  resolveSavedPortfolioSelection,
} from "../../../lib/trip-dashboard/savedItineraries.js";
import ItineraryDraftPanel from "../itinerary/ItineraryDraftPanel.jsx";

function getSavedStatusClass(statusLabel) {
  const normalized = String(statusLabel ?? "").toLowerCase().trim();

  if (normalized.includes("approved")) return "approved";
  if (normalized.includes("saved")) return "saved";
  if (normalized.includes("awaiting") || normalized.includes("pending") || normalized.includes("needs")) {
    return "pending";
  }

  return "default";
}

export default function ClientItineraryPage({ agencyTrips = [], agencyId }) {
  const [selectedClientId, setSelectedClientId] = useState(null);
  const [selectedTripId, setSelectedTripId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [fullItinerary, setFullItinerary] = useState(null);
  const [isLoadingItinerary, setIsLoadingItinerary] = useState(false);
  const [itineraryError, setItineraryError] = useState(null);
  const requestSequenceRef = useRef(0);

  const savedTrips = useMemo(() => getSavedItineraryTrips(agencyTrips), [agencyTrips]);
  const clients = useMemo(() => {
    const clientOrder = new Map();
    const tripOrder = new Map();

    savedTrips.forEach((trip, index) => {
      if (!tripOrder.has(trip.id)) tripOrder.set(trip.id, index);
      const clientName = String(trip?.clientName ?? "").trim().replace(/\s+/g, " ");
      const clientId = clientName.toLowerCase();
      if (clientId && !clientOrder.has(clientId)) clientOrder.set(clientId, index);
    });

    return groupSavedTripsByClient(savedTrips)
      .map((client) => ({
        ...client,
        trips: [...client.trips].sort((a, b) => (tripOrder.get(a.id) ?? 0) - (tripOrder.get(b.id) ?? 0)),
      }))
      .sort((a, b) => (clientOrder.get(a.id) ?? 0) - (clientOrder.get(b.id) ?? 0));
  }, [savedTrips]);

  const filteredClients = clients.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()));
  const selectedClient = clients.find(c => c.id === selectedClientId) || null;
  const selectedTrip = selectedClient?.trips.find(t => t.id === selectedTripId) || null;
  const selectedItineraryId = getStableItineraryId(selectedTrip);

  useEffect(() => {
    const nextSelection = resolveSavedPortfolioSelection({ clients, selectedClientId, selectedTripId });

    if (nextSelection.clientId !== selectedClientId) {
      setSelectedClientId(nextSelection.clientId);
    }

    if (nextSelection.tripId !== selectedTripId) {
      setSelectedTripId(nextSelection.tripId);
    }
  }, [clients, selectedClientId, selectedTripId]);

  useEffect(() => {
    const requestId = requestSequenceRef.current + 1;
    requestSequenceRef.current = requestId;
    let cancelled = false;

    if (!agencyId || !selectedTrip || !selectedItineraryId) {
      setFullItinerary(null);
      setIsLoadingItinerary(false);
      setItineraryError(null);
      return () => {
        cancelled = true;
      };
    }

    setIsLoadingItinerary(true);
    setItineraryError(null);

    fetchItineraryDraft(agencyId, selectedItineraryId)
      .then((res) => {
        if (cancelled || requestSequenceRef.current !== requestId) return;
        setFullItinerary(normalizeItineraryResponse(res));
      })
      .catch((err) => {
        if (cancelled || requestSequenceRef.current !== requestId) return;
        console.error(err);
        setFullItinerary(null);
        setItineraryError(err);
      })
      .finally(() => {
        if (cancelled || requestSequenceRef.current !== requestId) return;
        setIsLoadingItinerary(false);
      });

    return () => {
      cancelled = true;
    };
  }, [agencyId, selectedTrip, selectedItineraryId]);

  function renderItineraryContent() {
    if (isLoadingItinerary) {
      return <div className="empty-workspace"><div className="loading-spinner" /><p>Loading saved itinerary...</p></div>;
    }

    if (itineraryError) {
      return <div className="empty-workspace"><p>Unable to load this saved itinerary.</p></div>;
    }

    if (!selectedItineraryId) {
      return <div className="empty-workspace"><p>This saved trip is missing itinerary details.</p></div>;
    }

    if (fullItinerary) {
      return (
        <div className="itinerary-details-wrapper">
          <ItineraryDraftPanel
            itinerary={fullItinerary}
            draftDays={fullItinerary.days || []}
            draftVersion={`Saved itinerary v${fullItinerary.version || 1}`}
            primaryActionLabel="Open itinerary"
            tripSummary={selectedTrip}
          />
        </div>
      );
    }

    return <div className="empty-workspace"><p>This saved trip is missing itinerary details.</p></div>;
  }

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
          {filteredClients.length > 0 ? (
            filteredClients.map(c => {
              const initials = c.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
              return (
                <button key={c.id} className={`client-card ${selectedClientId === c.id ? 'active' : ''}`} aria-pressed={selectedClientId === c.id} onClick={() => { setSelectedClientId(c.id); setSelectedTripId(c.trips[0]?.id || null); }}>
                  <div className="client-avatar">{initials}</div>
                  <div className="client-info"><strong>{c.name}</strong><span>{c.trips.length} saved</span></div>
                </button>
              );
            })
          ) : (
            clients.length === 0 ? (
              <div className="empty-results">No saved itineraries yet.</div>
            ) : searchQuery.trim() ? (
              <div className="empty-results">No saved clients match your search.</div>
            ) : null
          )}
        </div>
      </aside>

      <main className="workspace-pane">
        {selectedClient ? (
          <div className="workspace-content">
            <header className="workspace-header">
              <div className="client-meta-row">
                <div className="client-meta-copy">
                  <h2>{selectedClient.name}</h2>
                  <span className="client-meta-label">Saved itineraries</span>
                </div>
                <span className="saved-count-pill">{selectedClient.trips.length} saved</span>
              </div>
            </header>
            <div className="workspace-layout">
              <div className="trip-strip">
                {selectedClient.trips.map(t => (
                  <button key={t.id} className={`trip-card ${selectedTripId === t.id ? 'active' : ''}`} aria-pressed={selectedTripId === t.id} onClick={() => setSelectedTripId(t.id)}>
                    <div className="trip-card-body">
                      <strong>{t.destination || "Unnamed Trip"}</strong>
                      <span className="trip-dates">{t.travelWindow || t.dates || "TBD"}</span>
                      <span className={`trip-status-chip ${getSavedStatusClass(getSavedStatusLabel(t))}`}>{getSavedStatusLabel(t)}</span>
                    </div>
                  </button>
                ))}
              </div>
              <div className="itinerary-preview-area">
                {renderItineraryContent()}
              </div>
            </div>
          </div>
        ) : (
          <div className="empty-workspace">
            <div className="empty-state-icon"><svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg></div>
            <h3>No saved itineraries yet.</h3><p>Saved itineraries will appear here after approval from Command Center.</p>
          </div>
        )}
      </main>

    </div>
  );
}
