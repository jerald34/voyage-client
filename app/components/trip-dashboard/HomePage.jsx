import { useState, useEffect, useRef } from "react";
import { initialAgencyPortfolioTrips } from "../../data/prototype/agency-portfolio.js";
import {
  getAgencyPortfolioSummary,
  getAgentCommandInsights,
  getAgentPriorityQueue,
  getApprovalBlockers,
  getUrgentDepartures,
} from "../../lib/agency-dashboard/selectors.js";
import AgentCommandCenter from "./AgentCommandCenter.jsx";
import AgencyMetricStrip from "./AgencyMetricStrip.jsx";
import AgentPriorityQueue from "./AgentPriorityQueue.jsx";
import ApprovalQueuePanel from "./ApprovalQueuePanel.jsx";
import ClientTripPortfolio from "./ClientTripPortfolio.jsx";
import UrgentDeparturesPanel from "./UrgentDeparturesPanel.jsx";

export default function HomePage({ agencyTrips = initialAgencyPortfolioTrips, onContinue, onOpenTrip }) {
  const [user, setUser] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const stored = localStorage.getItem("voyage-user");
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse user", e);
      }
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const summary = getAgencyPortfolioSummary(agencyTrips);
  const insights = getAgentCommandInsights(agencyTrips);
  const priorityQueue = getAgentPriorityQueue(agencyTrips);
  const urgentDepartures = getUrgentDepartures(agencyTrips);
  const approvalBlockers = getApprovalBlockers(agencyTrips);

  return (
    <div id="home" className="trip-dashboard-shell agency-dashboard-shell">
      <header className="landing-header trip-dashboard-header agency-dashboard-header">
        <a className="landing-brand" href="#home">
          Voyage
        </a>
        <div className="agency-header-profile-wrap" ref={dropdownRef}>
          <div className="agency-header-context">
            <span>{user?.displayName || "Guest"}</span>
            <strong>{user?.role === "ADMIN" ? "Platform Admin" : "Agency Operator"}</strong>
          </div>
          <button 
            className="agency-avatar" 
            onClick={() => setShowDropdown(!showDropdown)}
            aria-expanded={showDropdown}
          >
            {user?.displayName?.charAt(0) || "U"}
          </button>

          {showDropdown && (
            <div className="agency-profile-dropdown">
              <div className="dropdown-user-info">
                <strong>{user?.displayName}</strong>
                <span>{user?.email}</span>
              </div>
              <div className="dropdown-divider" />
              <div className="dropdown-menu">
                <button className="dropdown-item">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  Profile Settings
                </button>
                <button 
                  className="dropdown-item logout"
                  onClick={() => {
                    localStorage.removeItem("voyage-user");
                    window.location.href = "/login";
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      <AgentCommandCenter insights={insights} onRunReview={onContinue} />

      <AgencyMetricStrip summary={summary} />

      <div className="agency-dashboard-grid">
        <AgentPriorityQueue trips={priorityQueue} />
        <div className="agency-dashboard-side-stack">
          <UrgentDeparturesPanel trips={urgentDepartures} />
          <ApprovalQueuePanel trips={approvalBlockers} />
        </div>
      </div>

      <ClientTripPortfolio trips={agencyTrips} onOpenTrip={onOpenTrip} />
    </div>
  );
}
