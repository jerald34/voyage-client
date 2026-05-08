import React from "react";
import ClientSwitcher from "../command-center/ClientSwitcher.jsx";

export default function DashboardHeader({ 
  isSidebarOpen, 
  setIsSidebarOpen, 
  liveStatus, 
  scopedStreamError, 
  scopedIsStreaming, 
  getInitials, 
  displayName, 
  agencyId,
  // Trip management props
  onNewItinerary,
  isCreatingDraftThread,
  isClientMenuOpen,
  setIsClientMenuOpen,
  clientMenuRef,
  hasOptions,
  activeTripClientName,
  activeTripInitials,
  activeTripOrganizerInitials,
  clientMenuEmptyTitle,
  clientMenuEmptyBody,
  safeOptions,
  activeOption,
  onPlanningOptionDelete,
  deletingThreadId,
  onPlanningOptionChange,
  canApproveDraft,
  onApproveDraft
}) {
  return (
    <header className="voyage-header">
      <div className="brand-logo">
        <button
          className="mobile-menu-toggle"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          aria-label="Toggle menu"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {isSidebarOpen ? (
              <path d="M18 6L6 18M6 6l12 12" />
            ) : (
              <path d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
        <span className="brand-mark" aria-hidden="true">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2l3.2 6.3 6.8 1-4.9 4.8 1.2 6.8L12 17.7 5.7 21l1.2-6.8L2 9.3l6.8-1L12 2z" />
          </svg>
        </span>
        <div className="brand-text">
          <div className="brand-name">VOYAGE</div>
          <div className="brand-subtitle">Agency trip workspace</div>
        </div>
      </div>

      <div className="header-center">
        <button
          className="new-itinerary-button"
          onClick={() => onNewItinerary?.()}
          disabled={isCreatingDraftThread}
          type="button"
        >
          <span className="new-itinerary-icon" aria-hidden="true">+</span>
          {isCreatingDraftThread ? "Creating..." : "New Itinerary"}
        </button>

        <div className="agent-thread-actions">
          <ClientSwitcher
            isClientMenuOpen={isClientMenuOpen}
            setIsClientMenuOpen={setIsClientMenuOpen}
            clientMenuRef={clientMenuRef}
            hasOptions={hasOptions}
            activeTripClientName={activeTripClientName}
            activeTripInitials={activeTripInitials}
            activeTripOrganizerInitials={activeTripOrganizerInitials}
            clientMenuEmptyTitle={clientMenuEmptyTitle}
            clientMenuEmptyBody={clientMenuEmptyBody}
            safeOptions={safeOptions}
            activeOption={activeOption}
            getInitials={getInitials}
            onPlanningOptionDelete={onPlanningOptionDelete}
            deletingThreadId={deletingThreadId}
            onPlanningOptionChange={onPlanningOptionChange}
          />
          {canApproveDraft && (
            <button className="approve-draft-button" onClick={() => onApproveDraft?.()} type="button">
              Save to Client
            </button>
          )}
        </div>
      </div>

      <div className="header-actions">
        <div className={`run-status ${scopedStreamError ? "danger" : scopedIsStreaming ? "streaming" : "idle"}`}>
          <span className="status-dot" />
          {liveStatus}
        </div>
        <div className="user-profile">
          <div className="user-avatar" aria-hidden="true">
            {getInitials(displayName)}
          </div>
          <div className="user-info">
            <strong>{displayName}</strong>
            <span>{agencyId ? "Agency workspace" : "No agency selected"}</span>
          </div>
        </div>
      </div>
    </header>
  );
}

